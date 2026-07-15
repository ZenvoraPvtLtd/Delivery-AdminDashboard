import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { queueNotification, compileTemplate } from '../services/notificationService.js';
import { runScheduleCheck } from '../services/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, '..', 'db.json');

const router = express.Router();

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
  } catch (err) {
    return {};
  }
}

function writeDb(data) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
}

// 1. POST /api/orders/send-confirmation
router.post('/send-confirmation', async (req, res) => {
  const { orderId } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);
  
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const now = new Date();
  const expiryHours = db.communicationSettings?.confirmationExpiry || 24;

  order.confirmation_status = 'Pending';
  order.confirmation_source = null;
  order.confirmation_requested_at = now.toISOString();
  order.confirmation_token = `token_${Math.random().toString(36).substring(2, 11)}`;
  order.confirmation_expiry = new Date(now.getTime() + expiryHours * 60 * 60 * 1000).toISOString();
  order.customer_reply = null;

  // Add timeline entry
  order.timeline.push({
    status: 'Pending Confirmation',
    timestamp: now.toISOString(),
    title: 'Confirmation Workflow Triggered',
    description: 'System is initiating multi-channel dispatch.'
  });

  writeDb(db);

  // Trigger dispatch queue
  const io = req.app.get('io');
  io.to(orderId).emit('order_status', { status: order.status, timeline: order.timeline });
  io.emit('order_confirmation_updated', order);

  // Send the notification in the background
  setTimeout(async () => {
    await queueNotification(io, { orderId, type: 'confirmation' });
  }, 0);

  res.json({ success: true, order });
});

// Helper for cleaning phone number
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-10);
}

// 2. Webhooks Simulator & Handlers
// POST /api/webhook/whatsapp
router.post('/webhook/whatsapp', async (req, res) => {
  const { From, Body } = req.body; // Expect standard form fields or JSON
  const phone = normalizePhone(From);
  const text = (Body || '').trim();
  const io = req.app.get('io');

  console.log(`[Webhook WhatsApp] Incoming message from normalize(${From}) -> ${phone}: "${text}"`);
  
  const db = readDb();
  
  // Find latest pending order matching phone
  const order = db.orders.find(o => o.confirmation_status === 'Pending' && normalizePhone(o.customerPhone) === phone);

  if (!order) {
    console.warn(`[Webhook WhatsApp] No pending order found for phone ${phone}`);
    // Log incoming chat log
    const convId = `conv-${Date.now()}`;
    const inMessage = {
      id: convId,
      order_id: 'unknown',
      customer_number: From || '',
      message: text,
      direction: 'incoming',
      provider: 'whatsapp',
      timestamp: new Date().toISOString()
    };
    db.conversations = db.conversations || [];
    db.conversations.push(inMessage);
    writeDb(db);
    io.emit('new_chat', inMessage);

    return res.json({ success: false, message: 'No active order found.' });
  }

  // Log incoming message to conversations
  const convId = `conv-${Date.now()}`;
  const inMessage = {
    id: convId,
    order_id: order.id,
    customer_number: order.customerPhone,
    message: text,
    direction: 'incoming',
    provider: 'whatsapp',
    timestamp: new Date().toISOString()
  };
  db.conversations = db.conversations || [];
  db.conversations.push(inMessage);
  order.customer_reply = text;

  const now = new Date();
  const cleanText = text.toUpperCase();

  if (cleanText === 'YES' || cleanText.startsWith('YES') || cleanText.includes('CONFIRM')) {
    order.confirmation_status = 'Confirmed';
    order.confirmed_at = now.toISOString();
    order.confirmation_source = 'whatsapp';
    order.status = 'Preparing'; // Restaurant starts processing
    order.timeline.push({
      status: 'Confirmed',
      timestamp: now.toISOString(),
      title: 'Order Confirmed via WhatsApp',
      description: `Customer replied: "${text}".`
    });

    writeDb(db);

    // Trigger simulation
    const startSim = req.app.get('startOrderSimulation');
    if (startSim) startSim(order.id);

    // Trigger Success Notification reply
    setTimeout(async () => {
      await queueNotification(io, { orderId: order.id, type: 'success' });
    }, 100);

    // Broadcast toast alert to admin panel
    io.emit('new_notification', {
      id: `alert-${Date.now()}`,
      title: 'Order Confirmed',
      description: `Customer ${order.customerName} has confirmed Order #${order.id.split('-')[1]}.`,
      type: 'order',
      timestamp: now.toISOString(),
      read: false
    });

  } else if (cleanText === 'NO' || cleanText.startsWith('NO') || cleanText.includes('CANCEL')) {
    order.confirmation_status = 'Cancelled';
    order.cancelled_at = now.toISOString();
    order.confirmation_source = 'whatsapp';
    order.status = 'Cancelled';
    order.timeline.push({
      status: 'Cancelled',
      timestamp: now.toISOString(),
      title: 'Order Cancelled via WhatsApp',
      description: `Customer replied: "${text}".`
    });

    writeDb(db);

    // Trigger Cancellation reply
    setTimeout(async () => {
      await queueNotification(io, { orderId: order.id, type: 'cancellation' });
    }, 100);

    // Broadcast alert to admin
    io.emit('new_notification', {
      id: `alert-${Date.now()}`,
      title: 'Order Cancelled',
      description: `Customer ${order.customerName} cancelled Order #${order.id.split('-')[1]}.`,
      type: 'order',
      timestamp: now.toISOString(),
      read: false
    });

  } else {
    // Unsupported message format
    order.timeline.push({
      status: 'Awaiting Clarification',
      timestamp: now.toISOString(),
      title: 'Unrecognized Message Received',
      description: `Customer replied: "${text}". Expected YES or NO.`
    });
    writeDb(db);
  }

  io.to(order.id).emit('order_status', { status: order.status, timeline: order.timeline });
  io.emit('order_confirmation_updated', order);
  io.emit('new_chat', inMessage);

  res.json({ success: true });
});

// POST /api/webhook/sms
router.post('/webhook/sms', async (req, res) => {
  const { From, Body } = req.body;
  const phone = normalizePhone(From);
  const text = (Body || '').trim();
  const io = req.app.get('io');

  console.log(`[Webhook SMS] Incoming message from normalize(${From}) -> ${phone}: "${text}"`);
  
  const db = readDb();
  
  const order = db.orders.find(o => o.confirmation_status === 'Pending' && normalizePhone(o.customerPhone) === phone);

  if (!order) {
    const convId = `conv-${Date.now()}`;
    const inMessage = {
      id: convId,
      order_id: 'unknown',
      customer_number: From || '',
      message: text,
      direction: 'incoming',
      provider: 'sms',
      timestamp: new Date().toISOString()
    };
    db.conversations = db.conversations || [];
    db.conversations.push(inMessage);
    writeDb(db);
    io.emit('new_chat', inMessage);

    return res.json({ success: false, message: 'No active order found.' });
  }

  const convId = `conv-${Date.now()}`;
  const inMessage = {
    id: convId,
    order_id: order.id,
    customer_number: order.customerPhone,
    message: text,
    direction: 'incoming',
    provider: 'sms',
    timestamp: new Date().toISOString()
  };
  db.conversations = db.conversations || [];
  db.conversations.push(inMessage);
  order.customer_reply = text;

  const now = new Date();
  const cleanText = text.toUpperCase();

  if (cleanText === 'YES' || cleanText.startsWith('YES') || cleanText.includes('CONFIRM')) {
    order.confirmation_status = 'Confirmed';
    order.confirmed_at = now.toISOString();
    order.confirmation_source = 'sms';
    order.status = 'Preparing';
    order.timeline.push({
      status: 'Confirmed',
      timestamp: now.toISOString(),
      title: 'Order Confirmed via SMS',
      description: `Customer replied: "${text}".`
    });

    writeDb(db);

    // Trigger simulation
    const startSim = req.app.get('startOrderSimulation');
    if (startSim) startSim(order.id);

    setTimeout(async () =>>,StartLine:265,TargetContent: {
      await queueNotification(io, { orderId: order.id, type: 'success' });
    }, 100);

    io.emit('new_notification', {
      id: `alert-${Date.now()}`,
      title: 'Order Confirmed',
      description: `Customer ${order.customerName} has confirmed Order #${order.id.split('-')[1]}.`,
      type: 'order',
      timestamp: now.toISOString(),
      read: false
    });

  } else if (cleanText === 'NO' || cleanText.startsWith('NO') || cleanText.includes('CANCEL')) {
    order.confirmation_status = 'Cancelled';
    order.cancelled_at = now.toISOString();
    order.confirmation_source = 'sms';
    order.status = 'Cancelled';
    order.timeline.push({
      status: 'Cancelled',
      timestamp: now.toISOString(),
      title: 'Order Cancelled via SMS',
      description: `Customer replied: "${text}".`
    });

    writeDb(db);

    setTimeout(async () => {
      await queueNotification(io, { orderId: order.id, type: 'cancellation' });
    }, 100);

    io.emit('new_notification', {
      id: `alert-${Date.now()}`,
      title: 'Order Cancelled',
      description: `Customer ${order.customerName} cancelled Order #${order.id.split('-')[1]}.`,
      type: 'order',
      timestamp: now.toISOString(),
      read: false
    });
  } else {
    order.timeline.push({
      status: 'Awaiting Clarification',
      timestamp: now.toISOString(),
      title: 'Unrecognized Message Received',
      description: `Customer replied: "${text}". Expected YES or NO.`
    });
    writeDb(db);
  }

  io.to(order.id).emit('order_status', { status: order.status, timeline: order.timeline });
  io.emit('order_confirmation_updated', order);
  io.emit('new_chat', inMessage);

  res.json({ success: true });
});

// 3. POST /api/orders/confirm (Force Confirm)
router.post('/confirm', (req, res) => {
  const { orderId } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const now = new Date();
  order.confirmation_status = 'Confirmed';
  order.confirmed_at = now.toISOString();
  order.confirmation_source = 'admin';
  order.status = 'Preparing';
  order.timeline.push({
    status: 'Confirmed',
    timestamp: now.toISOString(),
    title: 'Force Confirmed by Admin',
    description: 'Admin manually confirmed this order.'
  });

  writeDb(db);

  // Trigger simulation
  const startSim = req.app.get('startOrderSimulation');
  if (startSim) startSim(order.id);

  const io = req.app.get('io');
  io.to(orderId).emit('order_status', { status: order.status, timeline: order.timeline });
  io.emit('order_confirmation_updated', order);

  res.json({ success: true, order });
});

// 4. POST /api/orders/cancel (Force Cancel)
router.post('/cancel', (req, res) => {
  const { orderId, reason } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const now = new Date();
  order.confirmation_status = 'Cancelled';
  order.cancelled_at = now.toISOString();
  order.confirmation_source = 'admin';
  order.status = 'Cancelled';
  order.timeline.push({
    status: 'Cancelled',
    timestamp: now.toISOString(),
    title: 'Force Cancelled by Admin',
    description: `Admin manually cancelled this order. Reason: ${reason || 'Admin Cancelled'}`
  });

  writeDb(db);

  const io = req.app.get('io');
  io.to(orderId).emit('order_status', { status: order.status, timeline: order.timeline });
  io.emit('order_confirmation_updated', order);

  res.json({ success: true, order });
});

// 5. GET /api/orders/confirmation-history
router.get('/confirmation-history', (req, res) => {
  const db = readDb();
  const list = db.orders.filter(o => o.confirmation_requested_at !== null);
  res.json(list);
});

// 6. GET /api/orders/logs
router.get('/logs', (req, res) => {
  const db = readDb();
  res.json(db.notifications || []);
});

// 7. POST /api/orders/resend
router.post('/resend', async (req, res) => {
  const { orderId, channel } = req.body; // channel: whatsapp, sms, both
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  order.timeline.push({
    status: 'Resending',
    timestamp: new Date().toISOString(),
    title: `Resend Requested (${channel})`,
    description: 'Admin requested manual resending of the confirmation template.'
  });

  writeDb(db);
  const io = req.app.get('io');

  setTimeout(async () => {
    await queueNotification(io, { orderId, type: 'confirmation' });
  }, 0);

  res.json({ success: true });
});

// 8. GET /api/analytics/order-confirmation
router.get('/analytics/order-confirmation', (req, res) => {
  const db = readDb();
  const orders = db.orders.filter(o => o.confirmation_requested_at !== null);
  const notifs = db.notifications || [];

  const total = orders.length;
  const confirmed = orders.filter(o => o.confirmation_status === 'Confirmed').length;
  const cancelled = orders.filter(o => o.confirmation_status === 'Cancelled').length;
  const pending = orders.filter(o => o.confirmation_status === 'Pending').length;
  const expired = orders.filter(o => o.confirmation_status === 'Expired').length;

  const waDelivered = notifs.filter(n => n.provider === db.communicationSettings.whatsappProvider && n.status === 'delivered').length;
  const waFailed = notifs.filter(n => n.provider === db.communicationSettings.whatsappProvider && n.status === 'failed').length;
  const smsDelivered = notifs.filter(n => n.provider === db.communicationSettings.smsProvider && n.status === 'delivered').length;
  const smsFailed = notifs.filter(n => n.provider === db.communicationSettings.smsProvider && n.status === 'failed').length;
  const awaitingReply = pending;

  // Average Confirmation Time (in minutes)
  let totalMinutes = 0;
  let countConfirmed = 0;
  orders.forEach(o => {
    if (o.confirmation_status === 'Confirmed' && o.confirmation_requested_at && o.confirmed_at) {
      const diffMs = new Date(o.confirmed_at).getTime() - new Date(o.confirmation_requested_at).getTime();
      totalMinutes += diffMs / (1000 * 60);
      countConfirmed++;
    }
  });
  const avgConfirmTime = countConfirmed > 0 ? parseFloat((totalMinutes / countConfirmed).toFixed(2)) : 0;

  // Confirmation Rate
  const confirmationRate = total > 0 ? parseFloat(((confirmed / total) * 100).toFixed(1)) : 0;

  // WhatsApp Success Rate
  const waTotal = waDelivered + waFailed;
  const waSuccessRate = waTotal > 0 ? parseFloat(((waDelivered / waTotal) * 100).toFixed(1)) : 100;

  // SMS Success Rate
  const smsTotal = smsDelivered + smsFailed;
  const smsSuccessRate = smsTotal > 0 ? parseFloat(((smsDelivered / smsTotal) * 100).toFixed(1)) : 100;

  // Top Cancellation Reasons (mock distribution for UI)
  const cancellationReasons = [
    { reason: 'Customer Cancelled', count: cancelled },
    { reason: 'Confirmation Expired', count: expired },
    { reason: 'Changed Mind', count: Math.ceil(cancelled * 0.1) },
    { reason: 'Wrong Address', count: Math.ceil(cancelled * 0.05) }
  ];

  res.json({
    cards: {
      total,
      pending,
      confirmed,
      cancelled,
      waDelivered,
      smsDelivered,
      waFailed,
      smsFailed,
      awaitingReply,
      avgConfirmTime,
      confirmationRate
    },
    analytics: {
      waSuccessRate,
      smsSuccessRate,
      cancellationReasons
    }
  });
});

// 9. POST /api/orders/simulate-time-leap (Testing API)
router.post('/simulate-time-leap', async (req, res) => {
  const { orderId, hours } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const requestedAt = order.confirmation_requested_at ? new Date(order.confirmation_requested_at) : new Date();
  
  // Subtract time to fake past request
  const offsetMs = hours * 60 * 60 * 1000;
  order.confirmation_requested_at = new Date(requestedAt.getTime() - offsetMs).toISOString();
  
  // Adjust timeline stamps back too so it looks correct
  order.timeline.forEach(step => {
    if (step.status === 'Pending Confirmation' || step.status.includes('Sent')) {
      step.timestamp = new Date(new Date(step.timestamp).getTime() - offsetMs).toISOString();
    }
  });

  writeDb(db);

  const io = req.app.get('io');
  io.to(orderId).emit('order_status', { status: order.status, timeline: order.timeline });
  io.emit('order_confirmation_updated', order);

  console.log(`[Time Leap Simulator] Order ${orderId} timestamp shifted back by ${hours} hours.`);

  // Manually trigger the schedule check to capture any state progression instantly
  await runScheduleCheck(io);

  // Return the updated order from the db
  const updatedDb = readDb();
  const updatedOrder = updatedDb.orders.find(o => o.id === orderId);

  res.json({ success: true, order: updatedOrder });
});

// 10. GET /api/orders/conversations/:orderId
router.get('/conversations/:orderId', (req, res) => {
  const { orderId } = req.params;
  const db = readDb();
  const chatHistory = (db.conversations || []).filter(c => c.order_id === orderId);
  res.json(chatHistory);
});

// 11. GET /api/orders/settings
router.get('/settings', (req, res) => {
  const db = readDb();
  res.json(db.communicationSettings || {});
});

// 12. POST /api/orders/settings
router.post('/settings', (req, res) => {
  const newSettings = req.body;
  const db = readDb();
  db.communicationSettings = newSettings;
  writeDb(db);

  req.app.get('io').emit('communication_settings_updated', newSettings);
  res.json({ success: true, settings: newSettings });
});

export default router;
