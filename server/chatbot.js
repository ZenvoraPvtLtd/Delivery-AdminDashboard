import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableLambda, RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

const ACTIVE_ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Out for Delivery'];

const dashboardRoutes = {
  orders: '/orders',
  customers: '/customers',
  delivery: '/delivery-partners',
  inventory: '/inventory',
  products: '/products',
  coupons: '/coupons',
  payments: '/payments',
  reports: '/reports-analytics',
  reviews: '/reviews-complaints',
  outlets: '/outlet-management',
  users: '/user-management',
  roles: '/role-permissions',
  banners: '/banner-cms',
  audit: '/audit-logs',
  settings: '/settings',
  dashboard: '/dashboard'
};

function money(value) {
  return `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function collection(value) {
  return Array.isArray(value) ? value : [];
}

export function buildDashboardSnapshot(db) {
  const orders = collection(db.orders);
  const products = collection(db.products);
  const customers = collection(db.customers);
  const riders = collection(db.deliveryPartners);
  const outlets = collection(db.outlets);
  const coupons = collection(db.coupons);
  const rawMaterials = collection(db.rawMaterials);
  const tickets = collection(db.tickets);
  const banners = collection(db.banners);

  const activeOrders = orders.filter(order => ACTIVE_ORDER_STATUSES.includes(order.status));
  const paidOrders = orders.filter(order => order.paymentStatus === 'Paid');
  const openTickets = tickets.filter(ticket => ['Open', 'In Progress'].includes(ticket.status));
  const lowStock = rawMaterials.filter(item => Number(item.stock) <= Number(item.minStockAlert));
  const availableRiders = riders.filter(rider => rider.status === 'Available');
  const activeCoupons = coupons.filter(coupon => coupon.status === 'Active');
  const blockedCustomers = customers.filter(customer => customer.status === 'Blocked');
  const revenue = paidOrders.reduce((total, order) => total + Number(order.total || 0), 0);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      orders: orders.length,
      activeOrders: activeOrders.length,
      revenue,
      customers: customers.length,
      blockedCustomers: blockedCustomers.length,
      riders: riders.length,
      availableRiders: availableRiders.length,
      outlets: outlets.length,
      products: products.length,
      availableProducts: products.filter(product => product.availability).length,
      activeCoupons: activeCoupons.length,
      lowStockItems: lowStock.length,
      openTickets: openTickets.length,
      activeBanners: banners.filter(banner => banner.status === 'Active').length
    },
    highlights: {
      activeOrders: activeOrders.slice(0, 5).map(order => ({
        id: order.id,
        customer: order.customerName,
        outlet: order.outletName,
        status: order.status,
        total: money(order.total),
        payment: order.paymentStatus
      })),
      lowStock: lowStock.slice(0, 5).map(item => ({
        name: item.name,
        stock: `${item.stock} ${item.unit}`,
        min: `${item.minStockAlert} ${item.unit}`,
        supplier: item.supplier
      })),
      openTickets: openTickets.slice(0, 5).map(ticket => ({
        id: ticket.id,
        orderId: ticket.orderId,
        customer: ticket.customerName,
        issue: ticket.issueType,
        priority: ticket.priority,
        status: ticket.status
      })),
      availableRiders: availableRiders.slice(0, 5).map(rider => ({
        id: rider.id,
        name: rider.name,
        vehicle: rider.vehicleType,
        rating: rider.rating
      }))
    }
  };
}

function buildContextText(snapshot) {
  return [
    `Generated: ${snapshot.generatedAt}`,
    `Orders: ${snapshot.totals.orders} total, ${snapshot.totals.activeOrders} active.`,
    `Revenue from paid orders: ${money(snapshot.totals.revenue)}.`,
    `Customers: ${snapshot.totals.customers} total, ${snapshot.totals.blockedCustomers} blocked.`,
    `Delivery partners: ${snapshot.totals.riders} total, ${snapshot.totals.availableRiders} available.`,
    `Outlets: ${snapshot.totals.outlets}. Products: ${snapshot.totals.products} total, ${snapshot.totals.availableProducts} available.`,
    `Coupons: ${snapshot.totals.activeCoupons} active. Low-stock items: ${snapshot.totals.lowStockItems}. Open tickets: ${snapshot.totals.openTickets}. Active banners: ${snapshot.totals.activeBanners}.`,
    `Active orders: ${JSON.stringify(snapshot.highlights.activeOrders)}.`,
    `Low stock: ${JSON.stringify(snapshot.highlights.lowStock)}.`,
    `Open tickets: ${JSON.stringify(snapshot.highlights.openTickets)}.`,
    `Available riders: ${JSON.stringify(snapshot.highlights.availableRiders)}.`
  ].join('\n');
}

function inferRoute(question) {
  const q = question.toLowerCase();
  if (/order|dispatch|prepar|refund|cancel/.test(q)) return dashboardRoutes.orders;
  if (/customer|wallet|reward|block/.test(q)) return dashboardRoutes.customers;
  if (/rider|delivery partner|driver|gps/.test(q)) return dashboardRoutes.delivery;
  if (/stock|inventory|raw|material|supplier/.test(q)) return dashboardRoutes.inventory;
  if (/product|menu|item|dish|availability/.test(q)) return dashboardRoutes.products;
  if (/coupon|promo|offer|discount/.test(q)) return dashboardRoutes.coupons;
  if (/payment|transaction|settlement|finance/.test(q)) return dashboardRoutes.payments;
  if (/report|analytic|revenue|sales/.test(q)) return dashboardRoutes.reports;
  if (/ticket|complaint|review|feedback/.test(q)) return dashboardRoutes.reviews;
  if (/outlet|branch|store|location/.test(q)) return dashboardRoutes.outlets;
  if (/user|staff|admin account/.test(q)) return dashboardRoutes.users;
  if (/role|permission|rbac|access/.test(q)) return dashboardRoutes.roles;
  if (/banner|cms|homepage/.test(q)) return dashboardRoutes.banners;
  if (/audit|log|history|activity/.test(q)) return dashboardRoutes.audit;
  if (/setting|api|config|backup/.test(q)) return dashboardRoutes.settings;
  return dashboardRoutes.dashboard;
}

function localAssistantReply({ question, snapshot }) {
  const q = question.toLowerCase().trim();
  const route = inferRoute(question);
  const totals = snapshot.totals;

  if (/^(hi|hello|hey|namaste)\b/.test(q)) {
    return `Hello, I am DelivoBot. I can help with live orders, customers, riders, inventory, payments, support tickets, reports, and admin settings. Right now you have ${totals.activeOrders} active orders, ${totals.availableRiders} available riders, and ${totals.lowStockItems} low-stock items.`;
  }

  if (/order|dispatch|prepar|refund|cancel/.test(q)) {
    const topOrders = snapshot.highlights.activeOrders
      .map(order => `${order.id}: ${order.customer}, ${order.status}, ${order.total}, ${order.payment}`)
      .join('; ');
    return `Orders desk summary: ${totals.activeOrders} active orders out of ${totals.orders}. ${topOrders || 'No active orders at the moment.'} Recommended action: open Orders, prioritize pending/preparing orders, assign available riders, and verify payment status before refunds. Route: ${route}`;
  }

  if (/stock|inventory|raw|material|supplier/.test(q)) {
    const lowStock = snapshot.highlights.lowStock
      .map(item => `${item.name} has ${item.stock} left, minimum ${item.min}`)
      .join('; ');
    return `Inventory health: ${totals.lowStockItems} item(s) need attention. ${lowStock || 'All tracked raw materials are above alert level.'} Recommended action: restock critical ingredients first and confirm supplier availability. Route: ${route}`;
  }

  if (/rider|delivery partner|driver|gps/.test(q)) {
    const riders = snapshot.highlights.availableRiders
      .map(rider => `${rider.name} (${rider.vehicle}, rating ${rider.rating})`)
      .join('; ');
    return `Delivery capacity: ${totals.availableRiders}/${totals.riders} riders are available. ${riders || 'No riders are currently available.'} Recommended action: assign nearest available rider from Delivery Partners or Orders. Route: ${route}`;
  }

  if (/customer|wallet|reward|block/.test(q)) {
    return `Customer summary: ${totals.customers} registered customers, ${totals.blockedCustomers} blocked accounts. For wallet credits/debits, open the customer profile, use wallet adjustment, and add a clear support note. Route: ${route}`;
  }

  if (/revenue|sales|report|analytic/.test(q)) {
    return `Business snapshot: paid-order revenue is ${money(totals.revenue)}, with ${totals.orders} total orders and ${totals.activeOrders} active orders. For client-ready charts and exports, use Reports & Analytics. Route: ${route}`;
  }

  if (/ticket|complaint|review|feedback/.test(q)) {
    const tickets = snapshot.highlights.openTickets
      .map(ticket => `${ticket.id}: ${ticket.priority} ${ticket.issue} for ${ticket.customer}`)
      .join('; ');
    return `Support queue: ${totals.openTickets} open/in-progress ticket(s). ${tickets || 'No urgent support tickets currently open.'} Recommended action: handle high-priority tickets first and record every reply. Route: ${route}`;
  }

  if (/coupon|promo|offer|discount/.test(q)) {
    return `Marketing summary: ${totals.activeCoupons} coupon(s) are active. Create or pause campaigns in Coupons & Offers, then verify usage limits and expiry dates before launch. Route: ${route}`;
  }

  return `Here is the admin snapshot: ${totals.activeOrders} active orders, ${totals.availableRiders} available riders, ${totals.lowStockItems} low-stock alerts, ${totals.openTickets} support tickets, and ${money(totals.revenue)} paid revenue. Best next place to continue: ${route}.`;
}

function createLocalChain() {
  return RunnableSequence.from([
    RunnableLambda.from(input => localAssistantReply(input)),
    new StringOutputParser()
  ]);
}

function createLlmChain() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    timeout: 8000,
    maxRetries: 1
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      [
        'You are DelivoBot, a senior admin assistant inside a food delivery admin dashboard.',
        'Answer professionally, concisely, and actionably for an admin user.',
        'Use only the dashboard context provided. If data is missing, say what can be checked next.',
        'Prefer 2-5 short sentences. Mention the most relevant dashboard route when useful.',
        `Known routes: ${JSON.stringify(dashboardRoutes)}`
      ].join(' ')
    ],
    [
      'human',
      'Dashboard context:\n{context}\n\nConversation:\n{history}\n\nAdmin question: {question}'
    ]
  ]);

  return RunnableSequence.from([prompt, model, new StringOutputParser()]);
}

const localChain = createLocalChain();
const llmChain = createLlmChain();

export async function answerChat({ message, history = [], db }) {
  const startedAt = Date.now();
  const question = String(message || '').trim();

  if (!question) {
    return {
      reply: 'Please type a question about orders, customers, inventory, riders, reports, or settings.',
      source: 'validation',
      route: dashboardRoutes.dashboard,
      latencyMs: Date.now() - startedAt
    };
  }

  const snapshot = buildDashboardSnapshot(db || {});
  const route = inferRoute(question);
  const safeHistory = collection(history)
    .slice(-8)
    .map(item => `${item.sender === 'user' ? 'Admin' : 'DelivoBot'}: ${String(item.text || '').slice(0, 500)}`)
    .join('\n');

  if (llmChain) {
    try {
      const reply = await llmChain.invoke({
        question,
        history: safeHistory || 'No prior conversation.',
        context: buildContextText(snapshot)
      });

      return {
        reply,
        source: 'langchain-openai',
        route,
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      console.warn('LangChain OpenAI response failed, using local chain:', error && error.message);
    }
  }

  const reply = await localChain.invoke({ question, snapshot });
  return {
    reply,
    source: 'langchain-local',
    route,
    latencyMs: Date.now() - startedAt
  };
}
