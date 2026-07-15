import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, '..', 'db.json');

// Helper to read/write DB
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

/**
 * Compiles a message template with order and customer variables.
 */
export function compileTemplate(template, data) {
  const vars = {
    CustomerName: data.customerName || 'Customer',
    OrderID: data.orderId || '',
    Items: data.items || '',
    Amount: data.amount || '0.00',
    Address: data.address || '',
    CompanyName: data.companyName || 'Delivo Cafe',
    SupportNumber: data.supportNumber || '+1 555-0100'
  };

  let compiled = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    compiled = compiled.replace(regex, value);
  }
  return compiled;
}

/**
 * Simulates sending WhatsApp or SMS through different providers.
 * Incorporates failure scenarios for testing retry & fallback mechanisms.
 */
export async function sendProviderMessage({ orderId, provider, channel, type, message, customerPhone, retryCount = 0 }) {
  console.log(`[Notification Engine] Dispatching via ${channel.toUpperCase()} (${provider}) to ${customerPhone} (Retry: ${retryCount})`);
  
  // Simulation of failures for testing:
  // 1. If phone number ends in '9', WhatsApp fails (triggering retry, then SMS fallback).
  // 2. If phone number ends in '8', both WhatsApp and SMS fail (triggering alerts).
  // 3. Or 10% random failure if not specified.
  let isFailure = false;
  let reason = 'Simulated delivery success';

  if (channel === 'whatsapp') {
    if (customerPhone.endsWith('9') || customerPhone.endsWith('8')) {
      isFailure = true;
      reason = 'Provider error code 500: Gateway Timeout';
    }
  } else if (channel === 'sms') {
    if (customerPhone.endsWith('8')) {
      isFailure = true;
      reason = 'Carrier error code 30008: Destination unreachable';
    }
  }

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  const timestamp = new Date().toISOString();

  if (isFailure) {
    console.warn(`[Notification Engine] ❌ Message delivery failed on ${channel}: ${reason}`);
    return {
      success: false,
      status: 'failed',
      sent_at: timestamp,
      provider_response: reason
    };
  }

  console.log(`[Notification Engine] ✅ Message delivered on ${channel} successfully.`);
  return {
    success: true,
    status: 'delivered',
    sent_at: timestamp,
    delivered_at: timestamp,
    provider_response: 'OK: Message Queued & Delivered'
  };
}

/**
 * Core notification dispatch manager. Runs the retry loop and fallback strategy.
 * If WhatsApp fails, retries up to 3 times, then triggers SMS.
 * If SMS fails, retries up to 3 times, then creates admin alerts.
 */
export async function queueNotification(io, { orderId, type, customData = {} }) {
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    console.error(`[Notification Queue] Order not found: ${orderId}`);
    return;
  }

  const settings = db.communicationSettings;
  const customerPhone = order.customerPhone;
  const customerName = order.customerName;

  // Compile variables
  const itemsString = order.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
  const templateVars = {
    customerName,
    orderId: order.id.split('-')[1] || order.id,
    items: itemsString,
    amount: order.total.toFixed(2),
    address: order.address,
    companyName: 'Delivo Cafe',
    supportNumber: '+1 555-0100',
    ...customData
  };

  // Determine channels and text
  const templateMap = {
    confirmation: settings.templates.confirmation,
    cancellation: settings.templates.cancellation,
    success: settings.templates.success,
    reminder: settings.templates.reminder
  };

  const messageText = compileTemplate(templateMap[type] || '', templateVars);

  // Initialize tracking lists
  db.notifications = db.notifications || [];
  db.conversations = db.conversations || [];

  let currentChannel = settings.enableWhatsapp ? 'whatsapp' : 'sms';
  let provider = currentChannel === 'whatsapp' ? settings.whatsappProvider : settings.smsProvider;
  let status = 'failed';
  let responseData = null;
  let attempt = 0;
  const maxRetries = settings.retryCount || 3;

  // Flow: Attempt WhatsApp first if enabled
  if (currentChannel === 'whatsapp') {
    while (attempt <= maxRetries) {
      // Create notification entry
      const notifId = `notif-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      
      const newNotif = {
        id: notifId,
        order_id: orderId,
        provider: provider,
        type: type,
        status: 'sent',
        message: messageText,
        sent_at: new Date().toISOString(),
        delivered_at: null,
        read_at: null,
        reply_at: null,
        retry_count: attempt,
        provider_response: 'Sending...',
        created_at: new Date().toISOString()
      };

      db.notifications.push(newNotif);
      writeDb(db);

      // Trigger socket event for sending state
      io.emit('new_notification', newNotif);

      responseData = await sendProviderMessage({
        orderId,
        provider,
        channel: 'whatsapp',
        type,
        message: messageText,
        customerPhone,
        retryCount: attempt
      });

      // Update notif in db
      const dbNotifIndex = db.notifications.findIndex(n => n.id === notifId);
      if (dbNotifIndex !== -1) {
        db.notifications[dbNotifIndex].status = responseData.status;
        db.notifications[dbNotifIndex].delivered_at = responseData.delivered_at || null;
        db.notifications[dbNotifIndex].provider_response = responseData.provider_response;
        
        // Simulate read event 1.5 seconds later if delivered
        if (responseData.success) {
          db.notifications[dbNotifIndex].read_at = new Date(Date.now() + 1500).toISOString();
        }
        writeDb(db);
        io.emit('new_notification', db.notifications[dbNotifIndex]);
      }

      // Log to conversation
      const convId = `conv-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const outMessage = {
        id: convId,
        order_id: orderId,
        customer_number: customerPhone,
        message: messageText,
        direction: 'outgoing',
        provider: 'whatsapp',
        timestamp: new Date().toISOString()
      };
      db.conversations.push(outMessage);
      writeDb(db);
      io.emit('new_chat', outMessage);

      // Log in order timeline
      const updatedOrder = db.orders.find(o => o.id === orderId);
      if (updatedOrder) {
        updatedOrder.timeline.push({
          status: 'WhatsApp Sent',
          timestamp: new Date().toISOString(),
          title: `WhatsApp Confirmation ${attempt > 0 ? `Retry ${attempt}` : 'Sent'}`,
          description: responseData.success 
            ? `Message delivered successfully to customer's WhatsApp.` 
            : `Delivery failed: ${responseData.provider_response}`
        });
        writeDb(db);
        io.to(orderId).emit('order_status', { status: updatedOrder.status, timeline: updatedOrder.timeline });
        io.emit('order_confirmation_updated', updatedOrder);
      }

      if (responseData.success) {
        status = 'delivered';
        break;
      }

      attempt++;
    }

    // Fallback to SMS if WhatsApp failed and SMS is enabled
    if (status === 'failed' && settings.enableSms) {
      console.log(`[Notification Engine] ⚠️ WhatsApp failed after max retries. Cascading fallback to SMS...`);
      currentChannel = 'sms';
      provider = settings.smsProvider;
      attempt = 0; // Reset retry counter for SMS
    }
  }

  // Attempt SMS
  if (currentChannel === 'sms') {
    while (attempt <= maxRetries) {
      const notifId = `notif-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const newNotif = {
        id: notifId,
        order_id: orderId,
        provider: provider,
        type: type,
        status: 'sent',
        message: `Your Order #${orderId.split('-')[1]} is waiting for confirmation. Reply YES to Confirm, Reply NO to Cancel.`,
        sent_at: new Date().toISOString(),
        delivered_at: null,
        read_at: null,
        reply_at: null,
        retry_count: attempt,
        provider_response: 'Sending...',
        created_at: new Date().toISOString()
      };

      db.notifications.push(newNotif);
      writeDb(db);
      io.emit('new_notification', newNotif);

      responseData = await sendProviderMessage({
        orderId,
        provider,
        channel: 'sms',
        type,
        message: newNotif.message,
        customerPhone,
        retryCount: attempt
      });

      const dbNotifIndex = db.notifications.findIndex(n => n.id === notifId);
      if (dbNotifIndex !== -1) {
        db.notifications[dbNotifIndex].status = responseData.status;
        db.notifications[dbNotifIndex].delivered_at = responseData.delivered_at || null;
        db.notifications[dbNotifIndex].provider_response = responseData.provider_response;
        writeDb(db);
        io.emit('new_notification', db.notifications[dbNotifIndex]);
      }

      const convId = `conv-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const outMessage = {
        id: convId,
        order_id: orderId,
        customer_number: customerPhone,
        message: newNotif.message,
        direction: 'outgoing',
        provider: 'sms',
        timestamp: new Date().toISOString()
      };
      db.conversations.push(outMessage);
      writeDb(db);
      io.emit('new_chat', outMessage);

      const updatedOrder = db.orders.find(o => o.id === orderId);
      if (updatedOrder) {
        updatedOrder.timeline.push({
          status: 'SMS Sent',
          timestamp: new Date().toISOString(),
          title: `SMS Confirmation ${attempt > 0 ? `Retry ${attempt}` : 'Sent'}`,
          description: responseData.success 
            ? `SMS delivered successfully to customer's mobile number.` 
            : `SMS Delivery failed: ${responseData.provider_response}`
        });
        writeDb(db);
        io.to(orderId).emit('order_status', { status: updatedOrder.status, timeline: updatedOrder.timeline });
        io.emit('order_confirmation_updated', updatedOrder);
      }

      if (responseData.success) {
        status = 'delivered';
        break;
      }

      attempt++;
    }
  }

  // If both channels failed, notify admin
  if (status === 'failed') {
    console.error(`[Notification Engine] 🚨 Critical: WhatsApp and SMS both failed for Order #${orderId}`);
    
    // Create admin warning log & notification
    const alertNotif = {
      id: `alert-${Date.now()}`,
      title: 'Confirmation Delivery Failure',
      description: `Unable to reach Rahul (${customerPhone}) for Order #${orderId.split('-')[1]}. All channels failed.`,
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Update db with new notification
    db.notifications.push(alertNotif);
    
    // Log to order timeline
    const updatedOrder = db.orders.find(o => o.id === orderId);
    if (updatedOrder) {
      updatedOrder.timeline.push({
        status: 'Delivery Failed',
        timestamp: new Date().toISOString(),
        title: 'Communication Channels Blocked',
        description: 'Both WhatsApp and SMS carriers rejected delivery attempts. Admin intervention required.'
      });
    }
    writeDb(db);
    
    io.emit('new_notification', alertNotif);
    if (updatedOrder) {
      io.to(orderId).emit('order_status', { status: updatedOrder.status, timeline: updatedOrder.timeline });
      io.emit('order_confirmation_updated', updatedOrder);
    }
  }

  return responseData;
}
