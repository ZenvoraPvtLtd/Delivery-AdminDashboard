import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

// Seed data
const initialDb = {
  outlets: [
    { id: 'out-1', name: 'Downtown Central Outlet', address: '124 Market St, Downtown', manager: 'Sarah Jenkins', phone: '+1 555-0192', status: 'Open', revenue: 15480, ordersCount: 420, taxNumber: 'GST-33AABCC1234D', hours: '08:00 AM - 11:00 PM' },
    { id: 'out-2', name: 'West End Cafe', address: '482 Broadway Rd, West End', manager: 'David Miller', phone: '+1 555-0144', status: 'Open', revenue: 9820, ordersCount: 260, taxNumber: 'GST-33AABCC5678E', hours: '09:00 AM - 10:00 PM' },
    { id: 'out-3', name: 'Metro Plaza Food Court', address: 'Suite 12, Metro Mall, Plaza St', manager: 'Elena Rostova', phone: '+1 555-0188', status: 'Open', revenue: 21300, ordersCount: 650, taxNumber: 'GST-33AABCC9012F', hours: '10:00 AM - 11:30 PM' },
    { id: 'out-4', name: 'North Suburbs Delivery Kitchen', address: 'Industrial Area Phase 2', manager: 'Rajesh Sharma', phone: '+1 555-0165', status: 'Open', revenue: 6400, ordersCount: 180, taxNumber: 'GST-33AABCC4321G', hours: '11:00 AM - 02:00 AM' }
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
  orders: [
    {
      id: 'order-101',
      customerId: 'cust-1',
      customerName: 'Marcus Aurelius',
      customerPhone: '+1 555-8921',
      outletId: 'out-1',
      outletName: 'Downtown Central Outlet',
      items: [
        { productId: 'prod-1', name: 'Truffle Mushroom Burger', quantity: 2, price: 12.99, isVeg: true },
        { productId: 'prod-4', name: 'Iced Vanilla Matcha Latte', quantity: 1, price: 5.99, isVeg: true }
      ],
      subtotal: 31.97,
      tax: 1.60,
      deliveryCharge: 2.99,
      packagingCharge: 1.50,
      discount: 3.20,
      total: 34.86,
      status: 'Preparing',
      paymentStatus: 'Paid',
      paymentMethod: 'UPI',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      preparationTimeRemaining: 8,
      address: 'Apt 4B, 32 Wall Street, Financial District, NY',
      orderType: 'Delivery',
      timeline: [
        { status: 'Pending', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), title: 'Order Placed', description: 'Order successfully placed by customer.' },
        { status: 'Pending', timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(), title: 'Order Confirmed', description: 'Payment verified and order sent to Kitchen.' },
        { status: 'Preparing', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), title: 'Kitchen Accepted', description: 'Chef Sarah started preparing the items.' }
      ]
    },
    {
      id: 'order-102',
      customerId: 'cust-2',
      customerName: 'Clara Oswald',
      customerPhone: '+1 555-4429',
      outletId: 'out-3',
      outletName: 'Metro Plaza Food Court',
      items: [
        { productId: 'prod-2', name: 'Spicy Pepperoni Pizza (12")', quantity: 1, price: 16.99, isVeg: false }
      ],
      subtotal: 16.99,
      tax: 2.04,
      deliveryCharge: 3.99,
      packagingCharge: 1.00,
      discount: 0,
      total: 24.02,
      status: 'Out for Delivery',
      paymentStatus: 'Paid',
      paymentMethod: 'Card',
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      deliveryPartnerId: 'rider-2',
      address: 'Floor 14, 52 Hudson Yards, Midtown West, NY',
      orderType: 'Delivery',
      timeline: [
        { status: 'Pending', timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(), title: 'Order Placed', description: 'Order placed by customer.' },
        { status: 'Pending', timestamp: new Date(Date.now() - 34 * 60 * 1000).toISOString(), title: 'Order Confirmed', description: 'Auto-accepted and routed to kitchen.' },
        { status: 'Preparing', timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(), title: 'Preparing', description: 'Oven heating, ingredients added.' },
        { status: 'Ready', timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(), title: 'Packed & Ready', description: 'Food packed in insulation container.' },
        { status: 'Out for Delivery', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), title: 'Handed Over to Rider', description: 'Rider Alex Mercer is transit with order.' }
      ]
    },
    {
      id: 'order-103',
      customerId: 'cust-3',
      customerName: 'Bruce Wayne',
      customerPhone: '+1 555-7700',
      outletId: 'out-1',
      outletName: 'Downtown Central Outlet',
      items: [
        { productId: 'prod-6', name: 'Premium Veggie Salad Bowl', quantity: 3, price: 10.99, isVeg: true },
        { productId: 'prod-4', name: 'Iced Vanilla Matcha Latte', quantity: 3, price: 5.99, isVeg: true }
      ],
      subtotal: 50.94,
      tax: 2.55,
      deliveryCharge: 0,
      packagingCharge: 2.00,
      discount: 5.10,
      total: 50.39,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      paymentMethod: 'Cash',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      address: 'Penthouse A, Wayne Tower, Manhattan, NY',
      orderType: 'Takeaway',
      timeline: [
        { status: 'Pending', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), title: 'Order Received', description: 'Awaiting confirmation and cash check.' }
      ]
    },
    {
      id: 'order-104',
      customerId: 'cust-4',
      customerName: 'Peter Parker',
      customerPhone: '+1 555-6743',
      outletId: 'out-2',
      outletName: 'West End Cafe',
      items: [
        { productId: 'prod-3', name: 'Avocado Toast with Poached Egg', quantity: 1, price: 9.50, isVeg: true },
        { productId: 'prod-5', name: 'Crispy Buffalo Chicken Wings (8pcs)', quantity: 1, price: 11.99, isVeg: false }
      ],
      subtotal: 21.49,
      tax: 2.15,
      deliveryCharge: 2.00,
      packagingCharge: 1.00,
      discount: 2.00,
      total: 24.64,
      status: 'Delivered',
      paymentStatus: 'Paid',
      paymentMethod: 'Wallet',
      createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      deliveryPartnerId: 'rider-3',
      address: 'Apt 2, 20 Ingram St, Queens, NY',
      orderType: 'Delivery',
      timeline: [
        { status: 'Pending', timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(), title: 'Placed', description: 'Order successfully submitted.' },
        { status: 'Preparing', timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString(), title: 'Prepared', description: 'Ready for delivery.' },
        { status: 'Out for Delivery', timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(), title: 'Dispatched', description: 'Rider on the way.' },
        { status: 'Delivered', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), title: 'Delivered', description: 'Order hand-delivered by Maria Gonzalez.' }
      ]
    }
  ],
  coupons: [
    { id: 'cpn-1', code: 'WELCOME50', discountType: 'Flat', value: 5.00, minOrderValue: 15.00, expiryDate: '2026-12-31', usageCount: 42, usageLimit: 500, targetType: 'All', status: 'Active' },
    { id: 'cpn-2', code: 'HAPPYHOUR20', discountType: 'Percentage', value: 20, minOrderValue: 20.00, maxDiscount: 8.00, expiryDate: '2026-08-30', usageCount: 15, usageLimit: 200, targetType: 'Outlet-wise', status: 'Active' },
    { id: 'cpn-3', code: 'FREEZE30', discountType: 'Percentage', value: 30, minOrderValue: 40.00, expiryDate: '2026-06-01', usageCount: 88, usageLimit: 100, targetType: 'Customer-wise', status: 'Expired' }
  ],
  rawMaterials: [
    { id: 'raw-1', name: 'Mozzarella Cheese', category: 'Dairy', stock: 12.5, unit: 'kg', minStockAlert: 15.0, supplier: 'Metro Dairy Farms', expiryDate: '2026-07-22' },
    { id: 'raw-2', name: 'Haas Avocados', category: 'Produce', stock: 35.0, unit: 'pcs', minStockAlert: 10.0, supplier: 'Green Growers Co', expiryDate: '2026-07-15' },
    { id: 'raw-3', name: 'Prime Pepperoni', category: 'Meat', stock: 8.0, unit: 'kg', minStockAlert: 5.0, supplier: 'Valley Meats Inc', expiryDate: '2026-08-10' },
    { id: 'raw-4', name: 'Matcha Powder (Ceremonial)', category: 'Dry Goods', stock: 2.2, unit: 'kg', minStockAlert: 1.0, supplier: 'Nippon Exports Ltd', expiryDate: '2027-01-30' },
    { id: 'raw-5', name: 'Brioche Burger Buns', category: 'Bakery', stock: 4.0, unit: 'pcs', minStockAlert: 40.0, supplier: 'Daily Bake Shop', expiryDate: '2026-07-11' }
  ],
  tickets: [
    {
      id: 'tkt-1',
      orderId: 'order-101',
      customerName: 'Marcus Aurelius',
      customerPhone: '+1 555-8921',
      issueType: 'Late Delivery',
      priority: 'High',
      status: 'Open',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      messages: [
        { sender: 'customer', text: 'My burger is taking forever. It says preparing for 15 minutes now.', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
        { sender: 'system', text: 'Ticket opened and assigned to Support Queue.', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: 'tkt-2',
      orderId: 'order-104',
      customerName: 'Peter Parker',
      customerPhone: '+1 555-6743',
      issueType: 'Cold Food',
      priority: 'Medium',
      status: 'Resolved',
      createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      assignedStaff: 'Support Rep Jenny',
      messages: [
        { sender: 'customer', text: 'The buffalo wings were cold and soggy when they arrived.', timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString() },
        { sender: 'support', text: 'Apologies for the experience Peter! I have initiated a $5.00 wallet cashback refund for the inconvenience.', timestamp: new Date(Date.now() - 170 * 60 * 1000).toISOString() },
        { sender: 'customer', text: 'Thank you, received in my wallet.', timestamp: new Date(Date.now() - 165 * 60 * 1000).toISOString() },
        { sender: 'system', text: 'Ticket marked as Resolved.', timestamp: new Date(Date.now() - 165 * 60 * 1000).toISOString() }
      ]
    }
  ],
  auditLogs: [
    { id: 'log-1', username: 'superadmin@delivo.com', role: 'Super Admin', action: 'Login Success', module: 'Auth', ipAddress: '192.168.1.42', browser: 'Chrome 126.0 (Windows)', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'log-2', username: 'kitchen.manager@delivo.com', role: 'Kitchen Manager', action: 'Update Availability (prod-3 to False)', module: 'Products', ipAddress: '192.168.1.88', browser: 'Firefox 125.0 (macOS)', timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString() },
    { id: 'log-3', username: 'superadmin@delivo.com', role: 'Super Admin', action: 'Create Coupon WELCOME50', module: 'Coupons', ipAddress: '192.168.1.42', browser: 'Chrome 126.0 (Windows)', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'log-4', username: 'delivery.manager@delivo.com', role: 'Delivery Manager', action: 'Assign Rider John Doe to Order 102', module: 'Orders', ipAddress: '192.168.2.14', browser: 'Safari 17.2 (iOS)', timestamp: new Date(Date.now() - 1.2 * 60 * 60 * 1000).toISOString() }
  ],
  customers: [
    { id: 'cust-1', name: 'Marcus Aurelius', phone: '+1 555-8921', email: 'marcus@philosophy.com', walletBalance: 42.50, rewardPoints: 1200, status: 'Active', addresses: ['Apt 4B, 32 Wall Street, Financial District, NY'], favoriteItems: ['Truffle Mushroom Burger'] },
    { id: 'cust-2', name: 'Clara Oswald', phone: '+1 555-4429', email: 'clara@tardis.co.uk', walletBalance: 15.00, rewardPoints: 450, status: 'Active', addresses: ['Floor 14, 52 Hudson Yards, Midtown West, NY'], favoriteItems: ['Iced Vanilla Matcha Latte'] },
    { id: 'cust-3', name: 'Bruce Wayne', phone: '+1 555-7700', email: 'bruce@waynecorp.com', walletBalance: 9800.00, rewardPoints: 95000, status: 'Active', addresses: ['Penthouse A, Wayne Tower, Manhattan, NY', 'Wayne Manor, Bristol County, NJ'], favoriteItems: ['Premium Veggie Salad Bowl'] },
    { id: 'cust-4', name: 'Peter Parker', phone: '+1 555-6743', email: 'peter@dailybugle.com', walletBalance: 8.50, rewardPoints: 120, status: 'Active', addresses: ['Apt 2, 20 Ingram St, Queens, NY'], favoriteItems: ['Crispy Buffalo Chicken Wings (8pcs)'] },
    { id: 'cust-5', name: 'Tony Stark', phone: '+1 555-3000', email: 'tony@stark.com', walletBalance: 450.00, rewardPoints: 12000, status: 'Blocked', addresses: ['10880 Malibu Point, CA'], favoriteItems: ['Truffle Mushroom Burger'] }
  ],
  banners: [
    { id: 'ban-1', title: 'Monsoon Special Combo 25%', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', status: 'Active', type: 'Homepage', schedule: '2026-07-01 to 2026-07-31' },
    { id: 'ban-2', title: 'Avocado Toast Weekend Sale', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600', status: 'Active', type: 'Offer', schedule: 'Saturday & Sunday' },
    { id: 'ban-3', title: 'Happy Hour BOGO Pop-up', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600', status: 'Paused', type: 'Popup', schedule: 'Daily 4 PM - 7 PM' }
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

// REST Endpoints
app.get('/api/db', (req, res) => {
  res.json(readDb());
});

// Update Order status
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
    return res.json({ success: true, order });
  }
  res.status(404).json({ error: 'Order not found' });
});

// Assign Rider to order
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
    return res.json({ success: true, order, rider });
  }
  res.status(404).json({ error: 'Order or Rider not found' });
});

// Toggle Customer security block status
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

// Adjust Customer wallet balance
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

// Update Customer addresses list
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

// Toggle Coupon active status
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

// Toggle Banner active status
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

// Append new Audit Log
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

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Backend server successfully listening on port ${PORT}`);
});
