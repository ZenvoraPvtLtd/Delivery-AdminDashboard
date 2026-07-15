import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'db.json');

const defaultTemplates = {
  confirmation: "Hello {{CustomerName}},\n\nThank you for choosing {{CompanyName}} ❤️\n\nYour Order Details\nOrder ID: {{OrderID}}\nItems: {{Items}}\nTotal Amount: ₹{{Amount}}\nDelivery Address: {{Address}}\n\nPlease confirm your order.\n\nReply YES to Confirm\nReply NO to Cancel\n\nThank You.",
  cancellation: "Your order has been cancelled successfully.\n\nIf this was a mistake, please contact support at {{SupportNumber}}.",
  success: "Thank You.\n\nYour order has been confirmed successfully.\nOrder ID: {{OrderID}}\n\nWe have started processing your order.",
  reminder: "Gentle Reminder ⏰\n\nYour Order {{OrderID}} is waiting for confirmation.\n\nReply YES to Confirm\nReply NO to Cancel."
};

const defaultSettings = {
  enableWhatsapp: true,
  enableSms: true,
  defaultProvider: 'meta',
  whatsappProvider: 'meta', // meta, twilio, gupshup, interakt, 360dialog
  smsProvider: 'twilio', // twilio, msg91, textlocal, fast2sms
  apiKeys: {
    metaToken: 'mock-meta-token-xyz-98765',
    twilioSid: 'mock-twilio-sid-12345',
    twilioAuthToken: 'mock-twilio-auth-token-67890',
    msg91Key: 'mock-msg91-key-abcde',
    textlocalKey: 'mock-textlocal-key-fghij',
    fast2smsKey: 'mock-fast2sms-key-klmno'
  },
  webhookSecret: 'whsec_ZenvoraSecretToken2026',
  retryCount: 3,
  confirmationExpiry: 24, // in hours
  templates: defaultTemplates
};

export function migrate() {
  console.log('[Migration] Checking database schema...');
  if (!fs.existsSync(dbFilePath)) {
    console.log('[Migration] Database file not found, skipping migration (it will be created by server/index.js)');
    return;
  }

  try {
    const rawData = fs.readFileSync(dbFilePath, 'utf8');
    const db = JSON.parse(rawData);

    let updated = false;

    if (!db.notifications) {
      db.notifications = [];
      updated = true;
    }

    if (!db.conversations) {
      db.conversations = [];
      updated = true;
    }

    if (!db.communicationSettings) {
      db.communicationSettings = defaultSettings;
      updated = true;
    } else {
      // Ensure all keys are present
      db.communicationSettings = { ...defaultSettings, ...db.communicationSettings };
      if (!db.communicationSettings.templates) {
        db.communicationSettings.templates = defaultTemplates;
      } else {
        db.communicationSettings.templates = { ...defaultTemplates, ...db.communicationSettings.templates };
      }
      updated = true;
    }

    // Migrate orders
    if (db.orders && Array.isArray(db.orders)) {
      db.orders.forEach(order => {
        if (order.confirmation_status === undefined) {
          order.confirmation_status = null;
          order.confirmation_source = null;
          order.confirmation_requested_at = null;
          order.confirmed_at = null;
          order.cancelled_at = null;
          order.confirmation_token = null;
          order.confirmation_expiry = null;
          order.customer_reply = null;
          updated = true;
        }
      });
    }

    if (updated) {
      fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));
      console.log('[Migration] Database successfully migrated to include confirmation tables/settings!');
    } else {
      console.log('[Migration] Database is already up to date.');
    }
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  migrate();
}
