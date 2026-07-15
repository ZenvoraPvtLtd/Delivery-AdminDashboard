import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { queueNotification } from './notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, '..', 'db.json');

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
 * Runs a scan over all orders to check reminder and expiry limits.
 * Can be run periodically or triggered on-demand (e.g. after time leap simulations).
 */
export async function runScheduleCheck(io) {
  const db = readDb();
  if (!db.orders || !Array.isArray(db.orders)) return;

  const now = new Date();
  let updated = false;

  for (const order of db.orders) {
    // Only check orders that are pending confirmation
    if (order.confirmation_status !== 'Pending') continue;

    const requestedAt = order.confirmation_requested_at ? new Date(order.confirmation_requested_at) : null;
    if (!requestedAt) continue;

    const elapsedMs = now.getTime() - requestedAt.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    // Count existing reminder notifications in db
    const reminderCount = (db.notifications || []).filter(
      n => n.order_id === order.id && n.type === 'reminder' && n.status !== 'failed'
    ).length;

    // 1. Check Expiry (24 hours by default, or configurable in settings)
    const expiryHours = db.communicationSettings?.confirmationExpiry || 24;
    if (elapsedHours >= expiryHours) {
      console.log(`[Scheduler] Order ${order.id} confirmation window has expired (${elapsedHours.toFixed(2)} hours elapsed)`);
      
      order.confirmation_status = 'Expired';
      order.status = 'Cancelled';
      order.cancelled_at = now.toISOString();
      order.timeline.push({
        status: 'Confirmation Expired',
        timestamp: now.toISOString(),
        title: 'Confirmation Expired',
        description: `Customer failed to confirm order within ${expiryHours} hours.`
      });

      // Notify admin
      const alertNotif = {
        id: `alert-${Date.now()}`,
        title: 'Order Confirmation Expired',
        description: `Order #${order.id.split('-')[1]} confirmation expired after ${expiryHours} hours. Status changed to Cancelled.`,
        type: 'system',
        timestamp: now.toISOString(),
        read: false
      };
      
      db.notifications = db.notifications || [];
      db.notifications.push(alertNotif);
      updated = true;

      // Broadcast update
      io.emit('new_notification', alertNotif);
      io.to(order.id).emit('order_status', { status: order.status, timeline: order.timeline });
      io.emit('order_confirmation_updated', order);
      continue;
    }

    // 2. Check Reminder 2 (6 hours elapsed, max 2 reminders)
    if (elapsedHours >= 6 && reminderCount < 2) {
      console.log(`[Scheduler] Dispatching Reminder 2 for Order ${order.id}`);
      updated = true;
      
      // We will perform the send asynchronously to prevent blocking the scheduler loop
      setTimeout(async () => {
        const checkDb = readDb();
        const currentOrder = checkDb.orders.find(o => o.id === order.id);
        if (currentOrder && currentOrder.confirmation_status === 'Pending') {
          await queueNotification(io, {
            orderId: order.id,
            type: 'reminder',
            customData: { messageLabel: 'Second Reminder' }
          });
        }
      }, 0);
    } 
    // 3. Check Reminder 1 (2 hours elapsed, max 1 reminder)
    else if (elapsedHours >= 2 && reminderCount < 1) {
      console.log(`[Scheduler] Dispatching Reminder 1 for Order ${order.id}`);
      updated = true;

      setTimeout(async () => {
        const checkDb = readDb();
        const currentOrder = checkDb.orders.find(o => o.id === order.id);
        if (currentOrder && currentOrder.confirmation_status === 'Pending') {
          await queueNotification(io, {
            orderId: order.id,
            type: 'reminder',
            customData: { messageLabel: 'First Reminder' }
          });
        }
      }, 0);
    }
  }

  if (updated) {
    writeDb(db);
  }
}

/**
 * Initializes the background scheduler thread. Runs checks every 10 seconds in production.
 */
export function startScheduler(io) {
  console.log('[Scheduler] Background Order Confirmation Monitor initialized.');
  
  // Run checks every 10 seconds
  const interval = setInterval(() => {
    runScheduleCheck(io);
  }, 10000);

  return interval;
}
