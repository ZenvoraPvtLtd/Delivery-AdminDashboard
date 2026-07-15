import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { answerChat } from './chatbot.js';
import { migrate } from './migrate.js';
import { startScheduler } from './services/scheduler.js';
import confirmationRouter from './routes/confirmation.js';
import { queueNotification } from './services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set('io', io);
app.set('startOrderSimulation', startOrderSimulation);
app.use('/api', confirmationRouter);

// Seed data
const initialDb = {
  outlets: [
    { id: 'out-1', name: 'Downtown Central Outlet', address: '124 Market St, Downtown', manager: 'Sarah Jenkins', phone: '+1 555-0192', status: 'Open', revenue: 15480, ordersCount: 420, taxNumber: 'GST-33AABCC1234D', hours: '08:00 AM - 11:00 PM', latitude: 40.7128, longitude: -74.0060 },
    { id: 'out-2', name: 'West End Cafe', address: '482 Broadway Rd, West End', manager: 'David Miller', phone: '+1 555-0144', status: 'Open', revenue: 9820, ordersCount: 260, taxNumber: 'GST-33AABCC5678E', hours: '09:00 AM - 10:00 PM', latitude: 40.7198, longitude: -74.0200 },
    { id: 'out-3', name: 'Metro Plaza Food Court', address: 'Suite 12, Metro Mall, Plaza St', manager: 'Elena Rostova', phone: '+1 555-0188', status: 'Open', revenue: 21300, ordersCount: 650, taxNumber: 'GST-33AABCC9012F', hours: '10:00 AM - 11:30 PM', latitude: 40.7090, longitude: -74.0010 },
    { id: 'out-4', name: 'North Suburbs Delivery Kitchen', address: 'Industrial Area Phase 2', manager: 'Rajesh Sharma', phone: '+1 555-0165', status: 'Open', revenue: 6400, ordersCount: 180, taxNumber: 'GST-33AABCC4321G', hours: '11:00 AM - 02:00 AM', latitude: 40.7250, longitude: -74.0200 }
  ],
  products: [
    { id: 'prod-1', name: 'Truffle Mushroom Burger', category: 'Fast Food', subcategory: 'Burgers', price: 12.99, discount: 10, availability: true, preparationTime: 12, isVeg: true, isBestSeller: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', outletIds: ['out-1', 'out-2', 'out-3'], gstRate: 5, description: 'Freshly grilled portobello mushroom with melted cheese, truffle paste, and signature brioche bun.' },
    { id: 'prod-2', name: 'Spicy Pepperoni Pizza (12")', category: 'Italian', subcategory: 'Pizza', price: 16.99, discount: 0, availability: true, preparationTime: 18, isVeg: false, isBestSeller: true, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', outletIds: ['out-1', 'out-3', 'out-4'], gstRate: 12, description: 'Crisp sourdough crust topped with spicy premium pepperoni slice, hand-stretched mozzarella, and tangy marinara.' },
    { id: 'prod-3', name: 'Avocado Toast with Poached Egg', category: 'Breakfast', subcategory: 'Toast', price: 9.50, discount: 5, availability: true, preparationTime: 8, isVeg: true, isBestSeller: false, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400', outletIds: ['out-1', 'out-2'], gstRate: 5, description: 'Smashed Haas avocados, flaky sea salt, organic eggs, sourdough bread toasted with organic butter.' },
    { id: 'prod-4', name: 'Iced Vanilla Matcha Latte', category: 'Beverages', subcategory: 'Teas', price: 5.99, discount: 0, availability: true, preparationTime: 4, isVeg: true, isBestSeller: true, image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400', outletIds: ['out-1', 'out-2', 'out-3', 'out-4'], gstRate: 5, description: 'Ceremonial grade Japanese Uji matcha whisked with organic oat milk and natural vanilla pod syrup.' },
    { id: 'prod-5', name: 'Crispy Buffalo Chicken Wings (8pcs)', category: 'Snacks', subcategory: 'Appetizers', price: 11.99, discount: 15, availability: true, preparationTime: 15, isVeg: false, isBestSeller: false, image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400', outletIds: ['out-1', 'out-3', 'out-4'], gstRate: 18, description: 'Spicy tossed bone-in chicken wings, glazed with signature hot sauce, served with blue cheese dip.' },
    { id: 'prod-6', name: 'Premium Veggie Salad Bowl', category: 'Salads', subcategory: 'Healthy', price: 10.99, discount: 0, availability: true, preparationTime: 7, isVeg: true, isBestSeller: false, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', outletIds: ['out-2', 'out-3'], gstRate: 5, description: 'Baby spinach, quinoa, cherry tomatoes, cucumbers, roasted chickpeas, organic feta, citrus vinaigrette.' }
  ],
  deliveryPartners: [
    { id: 'rider-1', name: 'John Doe', phone: '+1 555-0211', vehicleType: 'Bike', vehicleNumber: 'MC-4592', licenseVerified: true, insuranceExpiry: '2027-04-12', status: 'Available', rating: 4.8, earnings: 420.50, latitude: 40.7128, longitude: -74.0060, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100' },
    { id: 'rider-2', name: 'Alex Mercer', phone: '+1 555-0233', vehicleType: 'Scooter', vehicleNumber: 'SC-8812', licenseVerified: true, insuranceExpiry: '2026-11-30', status: 'On Delivery', rating: 4.9, earnings: 580.20, assignedOrderId: 'order-102', latitude: 40.7188, longitude: -74.0120, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { id: 'rider-3', name: 'Maria Gonzalez', phone: '+1 555-0245', vehicleType: 'E-Bike', vehicleNumber: 'EB-2914', licenseVerified: true, insuranceExpiry: '2028-02-15', status: 'Available', rating: 4.7, earnings: 340.00, latitude: 40.7090, longitude: -74.0010, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: 'rider-4', name: 'David Kim', phone: '+1 555-0288', vehicleType: 'Bike', vehicleNumber: 'MC-1102', licenseVerified: false, insuranceExpiry: '2026-08-20', status: 'Offline', rating: 4.2, earnings: 180.00, latitude: 40.7250, longitude: -74.0200, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
  ],
  orders: [],
  coupons: [
    { id: 'cpn-1', code: 'WELCOME50', discountType: 'Flat', value: 5.00, minOrderValue: 15.00, expiryDate: '2026-12-31', usageCount: 42, usageLimit: 500, targetType: 'All', status: 'Active' },
    { id: 'cpn-2', code: 'HAPPYHOUR20', discountType: 'Percentage', value: 20, minOrderValue: 20.00, maxDiscount: 8.00, expiryDate: '2026-08-30', usageCount: 15, usageLimit: 200, targetType: 'Outlet-wise', status: 'Active' },
    { id: 'cpn-3', code: 'FREEZE30', discountType: 'Percentage', value: 30, minOrderValue: 40.00, expiryDate: '2026-06-01', usageCount: 88, usageLimit: 100, targetType: 'Customer-wise', status: 'Expired' }
  ],
  rawMaterials: [
    { id: 'raw-1', name: 'Mozzarella Cheese', category: 'Dairy', stock: 12.5, unit: 'kg', minStockAlert: 15.0, supplier: 'Metro Dairy Farms', expiryDate: '2026-07-22' },
    { id: 'raw-2', name: 'Haas Avocados', category: 'Produce', stock: 35.0, unit: 'pcs', minStockAlert: 10.0, supplier: 'Green Growers Co', expiryDate: '2026-07-15' }
  ],
  tickets: [],
  auditLogs: [],
  customers: [
    { id: 'cust-1', name: 'Marcus Aurelius', phone: '+1 555-8921', email: 'marcus@philosophy.com', password: 'password123', walletBalance: 120.50, rewardPoints: 1200, status: 'Active', addresses: ['Apt 4B, 32 Wall Street, NY'], favoriteItems: ['Truffle Mushroom Burger'] },
    { id: 'cust-2', name: 'Clara Oswald', phone: '+1 555-4429', email: 'clara@tardis.co.uk', password: 'password123', walletBalance: 45.00, rewardPoints: 450, status: 'Active', addresses: ['Floor 14, 52 Hudson Yards, NY'], favoriteItems: ['Iced Vanilla Matcha Latte'] }
  ],
  banners: [
    { id: 'ban-1', title: 'Monsoon Special Combo 25% Off', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', status: 'Active', type: 'Homepage', schedule: '2026-07-01 to 2026-07-31' },
    { id: 'ban-2', title: 'Delicious Matcha Weekend Special', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600', status: 'Active', type: 'Offer', schedule: 'Saturday & Sunday' }
  ]
};

// Initialize file db helper
function readDb() {
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    return JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
  } catch (err) {
    return initialDb;
  }
}

function writeDb(data) {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
}

// Socket.IO tracking coordinator map
const activeSimulations = new Map();

function startOrderSimulation(orderId) {
  if (activeSimulations.has(orderId)) return;

  const statuses = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Picked Up', 'Out for Delivery', 'Delivered'];
  let currentStatusIndex = 0;

  // Route: Outlet to Customer NY Area
  const routePoints = [];
  const startLat = 40.7128;
  const startLng = -74.0060;
  const endLat = 40.7306;
  const endLng = -73.9352;

  // Pre-generate route coordinates
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    routePoints.push({
      latitude: startLat + (endLat - startLat) * fraction,
      longitude: startLng + (endLng - startLng) * fraction
    });
  }
  let routeIndex = 0;

  console.log(`[Simulation] Starting workflow for order: ${orderId}`);

  const timer = setInterval(() => {
    const db = readDb();
    const orderIndex = db.orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      clearInterval(timer);
      activeSimulations.delete(orderId);
      console.log(`[Simulation] Order ${orderId} not found, aborted.`);
      return;
    }

    const order = db.orders[orderIndex];

    if (order.status !== statuses[currentStatusIndex]) {
      const nextStatus = statuses[currentStatusIndex];
      order.status = nextStatus;
      
      order.timeline.push({
        status: nextStatus,
        timestamp: new Date().toISOString(),
        title: `Order is ${nextStatus}`,
        description: getStatusDescription(nextStatus)
      });

      if (nextStatus === 'Delivered') {
        order.paymentStatus = 'Paid';
        writeDb(db);
        io.to(orderId).emit('order_status', { status: 'Delivered', timeline: order.timeline });
        clearInterval(timer);
        activeSimulations.delete(orderId);
        console.log(`[Simulation] Order ${orderId} delivered, simulation stopped.`);
        return;
      }

      writeDb(db);
      io.to(orderId).emit('order_status', { status: nextStatus, timeline: order.timeline });
      console.log(`[Simulation] Order ${orderId} state transitioned to: ${nextStatus}`);
    }

    if (order.status === 'Out for Delivery') {
      if (routeIndex < routePoints.length) {
        const point = routePoints[routeIndex];
        const eta = Math.max(1, Math.round((routePoints.length - routeIndex) * 1.5));
        const distance = ((routePoints.length - routeIndex) * 0.35).toFixed(2);

        io.to(orderId).emit('rider_location', {
          latitude: point.latitude,
          longitude: point.longitude,
          etaMinutes: eta,
          distanceKm: parseFloat(distance),
          riderName: "Alex Mercer",
          riderPhone: "+1 555-0233",
          riderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
        });
        routeIndex++;
      } else {
        currentStatusIndex++; // move to Delivered
      }
    } else {
      currentStatusIndex++; // move to next status
    }
  }, 4000); // 4 seconds per state change/route node update

  activeSimulations.set(orderId, timer);
}

function getStatusDescription(status) {
  switch(status) {
    case 'Pending': return 'Awaiting restaurant approval.';
    case 'Accepted': return 'Restaurant accepted your order.';
    case 'Preparing': return 'Our chef is preparing your meal.';
    case 'Ready': return 'Order packed and ready for delivery partner pickup.';
    case 'Picked Up': return 'Delivery partner picked up your package.';
    case 'Out for Delivery': return 'Rider is on the way to your address.';
    case 'Delivered': return 'Your order has been delivered. Enjoy your meal!';
    default: return 'Processing your order.';
  }
}

// REST APIs
app.get('/api/db', (req, res) => {
  res.json(readDb());
});

app.get('/api/products', (req, res) => {
  const db = readDb();
  res.json(db.products);
});

app.get('/api/banners', (req, res) => {
  const db = readDb();
  res.json(db.banners);
});

app.get('/api/coupons', (req, res) => {
  const db = readDb();
  res.json(db.coupons.filter(c => c.status === 'Active'));
});

app.get('/api/categories', (req, res) => {
  const db = readDb();
  const categories = [...new Set(db.products.map(p => p.category))].map((catName, index) => {
    let icon = '🍔';
    if (catName.includes('Italian')) icon = '🍕';
    else if (catName.includes('Breakfast')) icon = '🍳';
    else if (catName.includes('Beverages')) icon = '🥤';
    else if (catName.includes('Snacks')) icon = '🍿';
    else if (catName.includes('Salads')) icon = '🥗';
    return { id: `cat-${index + 1}`, name: catName, icon };
  });
  res.json(categories);
});

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, phone, password } = req.body;
  const db = readDb();
  let customer = db.customers.find(c => (email && c.email === email) || (phone && c.phone === phone));

  if (!customer) {
    // Auto-register to make user onboarding seamless
    customer = {
      id: `cust-${Date.now()}`,
      name: email ? email.split('@')[0] : 'New Foodie',
      email: email || 'user@example.com',
      phone: phone || '+1 555-0000',
      password: password || 'password',
      walletBalance: 100.00, // free signup reward
      rewardPoints: 200,
      status: 'Active',
      addresses: [],
      favoriteItems: []
    };
    db.customers.push(customer);
    writeDb(db);
  }

  res.json({
    success: true,
    token: 'jwt-mock-token-xyz-12345',
    user: customer
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  const db = readDb();

  if (db.customers.some(c => c.email === email || c.phone === phone)) {
    return res.status(400).json({ error: 'User already exists with this email or phone number.' });
  }

  const customer = {
    id: `cust-${Date.now()}`,
    name,
    email,
    phone,
    password: password || 'password123',
    walletBalance: 50.00,
    rewardPoints: 100,
    status: 'Active',
    addresses: [],
    favoriteItems: []
  };

  db.customers.push(customer);
  writeDb(db);

  res.json({
    success: true,
    token: 'jwt-mock-token-xyz-12345',
    user: customer
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  const db = readDb();

  // Any 6 digit code works in simulation
  if (!code || code.length !== 6) {
    return res.status(400).json({ error: 'Invalid OTP format. Must be 6 digits.' });
  }

  let customer = db.customers.find(c => c.phone === phone);
  if (!customer) {
    customer = {
      id: `cust-${Date.now()}`,
      name: 'SMS Customer',
      email: `${phone.replace('+', '')}@delivo-mobile.com`,
      phone: phone,
      password: 'password123',
      walletBalance: 50.00,
      rewardPoints: 100,
      status: 'Active',
      addresses: [],
      favoriteItems: []
    };
    db.customers.push(customer);
    writeDb(db);
  }

  res.json({
    success: true,
    token: 'jwt-mock-token-xyz-12345',
    user: customer
  });
});

app.get('/api/auth/profile', (req, res) => {
  // Extract mock user id from header or use default
  const db = readDb();
  res.json(db.customers[0]);
});

// Admin Panel Order routes
app.post('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, updatedBy } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    order.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      title: `Status Updated to ${status}`,
      description: `Order status set by ${updatedBy}.`
    });

    if (status === 'Delivered') {
      order.paymentStatus = 'Paid';
    } else if (status === 'Cancelled') {
      order.paymentStatus = 'Refunded';
    }
    writeDb(db);
    io.to(id).emit('order_status', { status, timeline: order.timeline });
    return res.json({ success: true, order });
  }
  res.status(404).json({ error: 'Order not found' });
});

app.post('/api/orders/:id/assign-rider', (req, res) => {
  const { id } = req.params;
  const { riderId, updatedBy } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === id);
  const rider = db.deliveryPartners.find(r => r.id === riderId);

  if (order && rider) {
    order.deliveryPartnerId = riderId;
    order.status = 'Out for Delivery';
    order.timeline.push({
      status: 'Out for Delivery',
      timestamp: new Date().toISOString(),
      title: 'Dispatched with Rider',
      description: `Assigned to rider ${rider.name} by ${updatedBy}.`
    });
    rider.status = 'On Delivery';
    rider.assignedOrderId = id;
    writeDb(db);

    io.to(id).emit('order_status', { status: 'Out for Delivery', timeline: order.timeline });
    return res.json({ success: true, order, rider });
  }
  res.status(404).json({ error: 'Order or Rider not found' });
});

// Create Order API (called from Customer Application)
app.post('/api/orders', (req, res) => {
  const orderData = req.body;
  const db = readDb();

  const settings = db.communicationSettings || {};
  const isConfirmationEnabled = settings.enableWhatsapp || settings.enableSms;

  const now = new Date();
  const expiryHours = settings.confirmationExpiry || 24;

  const newOrder = {
    id: `order-${Date.now().toString().slice(-4)}`,
    createdAt: now.toISOString(),
    status: 'Pending',
    timeline: [
      {
        status: 'Pending',
        timestamp: now.toISOString(),
        title: 'Order Placed',
        description: 'Your order was successfully submitted.'
      }
    ],
    ...orderData,

    // Add confirmation properties
    confirmation_status: isConfirmationEnabled ? 'Pending' : null,
    confirmation_source: null,
    confirmation_requested_at: isConfirmationEnabled ? now.toISOString() : null,
    confirmation_token: isConfirmationEnabled ? `token_${Math.random().toString(36).substring(2, 11)}` : null,
    confirmation_expiry: isConfirmationEnabled ? new Date(now.getTime() + expiryHours * 60 * 60 * 1000).toISOString() : null,
    customer_reply: null
  };

  if (isConfirmationEnabled) {
    newOrder.timeline.push({
      status: 'Pending Confirmation',
      timestamp: now.toISOString(),
      title: 'Confirmation Workflow Triggered',
      description: 'System is initiating multi-channel dispatch.'
    });
  }

  db.orders.unshift(newOrder);

  // Update customer statistics/wallet balance if using wallet payment
  const customer = db.customers.find(c => c.id === orderData.customerId);
  if (customer) {
    if (orderData.paymentMethod === 'Wallet') {
      customer.walletBalance = Math.max(0, customer.walletBalance - orderData.total);
    }
    // Grant reward points
    customer.rewardPoints += Math.round(orderData.subtotal);
  }

  writeDb(db);

  if (isConfirmationEnabled) {
    // Send confirmation message in background
    setTimeout(async () => {
      await queueNotification(io, { orderId: newOrder.id, type: 'confirmation' });
    }, 0);
  } else {
    // If confirmation is disabled, immediately accept order and start standard delivery tracking
    startOrderSimulation(newOrder.id);
  }

  res.json({
    success: true,
    order: newOrder
  });
});

// Customer Details & Wallet
app.post('/api/customers/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = readDb();
  const customer = db.customers.find(c => c.id === id);
  if (customer) {
    customer.status = status;
    writeDb(db);
    return res.json({ success: true, customer });
  }
  res.status(404).json({ error: 'Customer not found' });
});

app.post('/api/customers/:id/wallet', (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const db = readDb();
  const customer = db.customers.find(c => c.id === id);
  if (customer) {
    customer.walletBalance += amount;
    writeDb(db);
    return res.json({ success: true, customer });
  }
  res.status(404).json({ error: 'Customer not found' });
});

app.post('/api/customers/:id/addresses', (req, res) => {
  const { id } = req.params;
  const { addresses } = req.body;
  const db = readDb();
  const customer = db.customers.find(c => c.id === id);
  if (customer) {
    customer.addresses = addresses;
    writeDb(db);
    return res.json({ success: true, customer });
  }
  res.status(404).json({ error: 'Customer not found' });
});

app.post('/api/coupons/:id/toggle', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const coupon = db.coupons.find(c => c.id === id);
  if (coupon) {
    coupon.status = coupon.status === 'Active' ? 'Paused' : 'Active';
    writeDb(db);
    return res.json({ success: true, coupon });
  }
  res.status(404).json({ error: 'Coupon not found' });
});

app.post('/api/banners/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = readDb();
  const banner = db.banners.find(b => b.id === id);
  if (banner) {
    banner.status = status;
    writeDb(db);
    return res.json({ success: true, banner });
  }
  res.status(404).json({ error: 'Banner not found' });
});

app.post('/api/audit-logs', (req, res) => {
  const log = req.body;
  const db = readDb();
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  db.auditLogs.unshift(newLog);
  writeDb(db);
  res.json({ success: true, log: newLog });
});

// Chatbot route
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};
    const result = await answerChat({
      message,
      history,
      db: readDb()
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('Chatbot endpoint failed:', err);
    res.status(500).json({
      success: false,
      reply: 'I could not process that request right now. Please try again in a moment.',
      error: 'CHATBOT_ERROR'
    });
  }
});

// WebSocket Connection Events
io.on('connection', (socket) => {
  console.log(`[Socket] New client connection: ${socket.id}`);

  socket.on('join_order', (orderId) => {
    socket.join(orderId);
    console.log(`[Socket] Client ${socket.id} joined tracking room: ${orderId}`);
    
    // Send current status immediately
    const db = readDb();
    const order = db.orders.find(o => o.id === orderId);
    if (order) {
      socket.emit('order_status', { status: order.status, timeline: order.timeline });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`[Backend System] Running Express and Socket.IO server on port ${PORT}`);
  
  // Create database file if missing and perform migration
  readDb();
  migrate();
  
  // Start the automated reminder/expiry scheduler
  startScheduler(io);
});
