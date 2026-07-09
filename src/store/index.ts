import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Product, 
  Outlet, 
  DeliveryPartner, 
  Order, 
  Coupon, 
  RawMaterial, 
  SupportTicket, 
  AuditLog, 
  initialOutlets, 
  initialProducts, 
  initialDeliveryPartners, 
  initialOrders, 
  initialCoupons, 
  initialRawMaterials, 
  initialTickets, 
  initialAuditLogs,
  initialCustomers
} from './mockDb';

export type UserRole = 
  | 'Super Admin' 
  | 'Admin' 
  | 'Outlet Manager' 
  | 'Kitchen Manager' 
  | 'Delivery Manager' 
  | 'Finance Manager' 
  | 'Inventory Manager' 
  | 'Customer Support' 
  | 'Marketing Manager';

export interface ModulePermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
  approve: boolean;
}

export type PermissionMatrix = Record<string, ModulePermissions>;

const defaultModules = [
  'Dashboard', 'Orders', 'Products', 'Categories', 'Menu Management', 
  'Inventory', 'Customers', 'Delivery Partners', 'Outlet Management', 
  'Coupons', 'Offers', 'Payments', 'Wallet', 'Reviews', 'Complaints', 
  'Reports', 'Analytics', 'Notifications', 'Banner Management', 'CMS', 
  'User Management', 'Role & Permissions', 'Audit Logs', 'Settings', 
  'API Integrations', 'Backup & Restore'
];

// Predefined RBAC Matrix
const initialRBACState: Record<UserRole, PermissionMatrix> = {
  'Super Admin': defaultModules.reduce((acc, m) => {
    acc[m] = { create: true, read: true, update: true, delete: true, export: true, approve: true };
    return acc;
  }, {} as PermissionMatrix),
  
  'Admin': defaultModules.reduce((acc, m) => {
    acc[m] = { create: true, read: true, update: true, delete: true, export: true, approve: true };
    return acc;
  }, {} as PermissionMatrix),
  
  'Outlet Manager': defaultModules.reduce((acc, m) => {
    const isSpecial = ['Settings', 'API Integrations', 'Backup & Restore', 'Role & Permissions'].includes(m);
    acc[m] = { 
      create: !isSpecial, 
      read: !isSpecial, 
      update: !isSpecial, 
      delete: false, 
      export: true, 
      approve: ['Orders', 'Inventory'].includes(m) 
    };
    return acc;
  }, {} as PermissionMatrix),

  'Kitchen Manager': defaultModules.reduce((acc, m) => {
    const isAllowed = ['Dashboard', 'Products', 'Categories', 'Menu Management', 'Inventory'].includes(m);
    acc[m] = { 
      create: isAllowed, 
      read: isAllowed || m === 'Orders', 
      update: isAllowed || m === 'Orders', 
      delete: false, 
      export: false, 
      approve: false 
    };
    return acc;
  }, {} as PermissionMatrix),

  'Delivery Manager': defaultModules.reduce((acc, m) => {
    const isAllowed = ['Dashboard', 'Orders', 'Delivery Partners', 'Reports'].includes(m);
    acc[m] = { 
      create: isAllowed, 
      read: isAllowed, 
      update: isAllowed, 
      delete: false, 
      export: true, 
      approve: m === 'Orders' 
    };
    return acc;
  }, {} as PermissionMatrix),

  'Finance Manager': defaultModules.reduce((acc, m) => {
    const isAllowed = ['Dashboard', 'Payments', 'Wallet', 'Reports', 'Analytics'].includes(m);
    acc[m] = { 
      create: false, 
      read: isAllowed, 
      update: false, 
      delete: false, 
      export: true, 
      approve: m === 'Payments' 
    };
    return acc;
  }, {} as PermissionMatrix),

  'Inventory Manager': defaultModules.reduce((acc, m) => {
    const isAllowed = ['Dashboard', 'Inventory', 'Reports'].includes(m);
    acc[m] = { 
      create: isAllowed, 
      read: isAllowed, 
      update: isAllowed, 
      delete: false, 
      export: true, 
      approve: m === 'Inventory' 
    };
    return acc;
  }, {} as PermissionMatrix),

  'Customer Support': defaultModules.reduce((acc, m) => {
    const isAllowed = ['Dashboard', 'Orders', 'Customers', 'Reviews', 'Complaints', 'CMS'].includes(m);
    acc[m] = { 
      create: m === 'Complaints', 
      read: isAllowed, 
      update: isAllowed, 
      delete: false, 
      export: false, 
      approve: false 
    };
    return acc;
  }, {} as PermissionMatrix),

  'Marketing Manager': defaultModules.reduce((acc, m) => {
    const isAllowed = ['Dashboard', 'Coupons', 'Offers', 'Banner Management', 'Notifications', 'Reports', 'Analytics'].includes(m);
    acc[m] = { 
      create: isAllowed, 
      read: isAllowed, 
      update: isAllowed, 
      delete: isAllowed, 
      export: true, 
      approve: false 
    };
    return acc;
  }, {} as PermissionMatrix)
};

// UI Slice
interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'order' | 'stock' | 'system' | 'ticket';
  timestamp: string;
  read: boolean;
}

interface UIState {
  mode: 'light' | 'dark';
  activeOutletId: string; // 'all' or specific outlet-id
  notifications: Notification[];
}

const initialUIState: UIState = {
  mode: 'light',
  activeOutletId: 'all',
  notifications: [
    { id: 'nt-1', title: 'Low Stock Alert', description: 'Brioche Burger Buns is below warning limit (4 pcs).', type: 'stock', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), read: false },
    { id: 'nt-2', title: 'High Priority Ticket', description: 'Marcus Aurelius opened a ticket for Order #101.', type: 'ticket', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), read: false },
    { id: 'nt-3', title: 'New Takeaway Order', description: 'Bruce Wayne placed Order #103 ($50.39).', type: 'order', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), read: true }
  ]
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    toggleThemeMode(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setActiveOutlet(state, action: PayloadAction<string>) {
      state.activeOutletId = action.payload;
    },
    addNotification(state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) {
      state.notifications.unshift({
        id: `nt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload
      });
    },
    markAllNotificationsRead(state) {
      state.notifications.forEach(n => n.read = true);
    },
    clearNotifications(state) {
      state.notifications = [];
    }
  }
});

// Auth Slice
interface AuthState {
  isAuthenticated: boolean;
  is2FARequired: boolean;
  is2FAVerified: boolean;
  user: {
    email: string;
    name: string;
    role: UserRole;
    outletId?: string; // assigned outlet if Outlet Manager
  } | null;
  sessionTimeout: number; // in seconds
  rememberMe: boolean;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  is2FARequired: false,
  is2FAVerified: false,
  user: null,
  sessionTimeout: 1800, // 30 minutes
  rememberMe: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    loginRequest(state, action: PayloadAction<{ email: string; name: string; role: UserRole; rememberMe: boolean }>) {
      state.user = {
        email: action.payload.email,
        name: action.payload.name,
        role: action.payload.role,
        outletId: action.payload.role === 'Outlet Manager' ? 'out-1' : undefined
      };
      state.rememberMe = action.payload.rememberMe;
      // Force 2FA for Super Admin, Admin, and Finance Manager roles as a showcase
      if (['Super Admin', 'Admin', 'Finance Manager'].includes(action.payload.role)) {
        state.is2FARequired = true;
        state.is2FAVerified = false;
        state.isAuthenticated = false;
      } else {
        state.is2FARequired = false;
        state.is2FAVerified = true;
        state.isAuthenticated = true;
      }
    },
    verify2FA(state, action: PayloadAction<string>) {
      // Mock code verification (accepts '123456' or any 6-digit code)
      if (action.payload.length === 6) {
        state.is2FAVerified = true;
        state.isAuthenticated = true;
        state.is2FARequired = false;
      }
    },
    logout(state) {
      state.isAuthenticated = false;
      state.is2FAVerified = false;
      state.is2FARequired = false;
      state.user = null;
    },
    extendSession(state) {
      state.sessionTimeout = 1800;
    },
    decrementSession(state) {
      if (state.sessionTimeout > 0) {
        state.sessionTimeout -= 1;
      } else {
        state.isAuthenticated = false;
        state.user = null;
      }
    }
  }
});

// RBAC Slice
const rbacSlice = createSlice({
  name: 'rbac',
  initialState: initialRBACState,
  reducers: {
    togglePermission(state, action: PayloadAction<{ role: UserRole; module: string; action: keyof ModulePermissions }>) {
      const { role, module, action: act } = action.payload;
      if (state[role] && state[role][module]) {
        state[role][module][act] = !state[role][module][act];
      }
    },
    resetPermissions(state) {
      return initialRBACState;
    }
  }
});

// Mock Database Slice
const dbSlice = createSlice({
  name: 'db',
  initialState: {
    outlets: initialOutlets,
    products: initialProducts,
    deliveryPartners: initialDeliveryPartners,
    orders: initialOrders,
    coupons: initialCoupons,
    rawMaterials: initialRawMaterials,
    tickets: initialTickets,
    auditLogs: initialAuditLogs,
    customers: initialCustomers,
    banners: [
      { id: 'ban-1', title: 'Monsoon Special Combo 25%', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', status: 'Active', type: 'Homepage', schedule: '2026-07-01 to 2026-07-31' },
      { id: 'ban-2', title: 'Avocado Toast Weekend Sale', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600', status: 'Active', type: 'Offer', schedule: 'Saturday & Sunday' },
      { id: 'ban-3', title: 'Happy Hour BOGO Pop-up', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600', status: 'Paused', type: 'Popup', schedule: 'Daily 4 PM - 7 PM' }
    ]
  },
  reducers: {
    // Orders
    updateOrderStatus(state, action: PayloadAction<{ id: string; status: Order['status']; updatedBy: string }>) {
      const order = state.orders.find(o => o.id === action.payload.id);
      if (order) {
        order.status = action.payload.status;
        order.timeline.push({
          status: action.payload.status,
          timestamp: new Date().toISOString(),
          title: `Status Updated to ${action.payload.status}`,
          description: `Order status set by ${action.payload.updatedBy}.`
        });
        
        // Auto handle paymentStatus for delivered/cancelled
        if (action.payload.status === 'Delivered') {
          order.paymentStatus = 'Paid';
        } else if (action.payload.status === 'Cancelled') {
          order.paymentStatus = 'Refunded';
        }
      }
    },
    assignRider(state, action: PayloadAction<{ orderId: string; riderId: string; updatedBy: string }>) {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      const rider = state.deliveryPartners.find(r => r.id === action.payload.riderId);
      
      if (order && rider) {
        order.deliveryPartnerId = action.payload.riderId;
        order.status = 'Out for Delivery';
        order.timeline.push({
          status: 'Out for Delivery',
          timestamp: new Date().toISOString(),
          title: 'Assigned to Rider',
          description: `Handed over to delivery partner ${rider.name}. Assigned by ${action.payload.updatedBy}.`
        });
        
        // Update rider status
        rider.status = 'On Delivery';
        rider.assignedOrderId = action.payload.orderId;
      }
    },
    refundOrder(state, action: PayloadAction<{ orderId: string; reason: string; updatedBy: string }>) {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      if (order) {
        order.paymentStatus = 'Refunded';
        order.status = 'Cancelled';
        order.timeline.push({
          status: 'Cancelled',
          timestamp: new Date().toISOString(),
          title: 'Refund Approved',
          description: `Refund processed by ${action.payload.updatedBy}. Reason: ${action.payload.reason}.`
        });
      }
    },
    // Products
    addEditProduct(state, action: PayloadAction<Product>) {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index > -1) {
        state.products[index] = action.payload;
      } else {
        state.products.push(action.payload);
      }
    },
    deleteProduct(state, action: PayloadAction<string>) {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
    toggleProductAvailability(state, action: PayloadAction<string>) {
      const prod = state.products.find(p => p.id === action.payload);
      if (prod) {
        prod.availability = !prod.availability;
      }
    },
    // Riders
    addEditRider(state, action: PayloadAction<DeliveryPartner>) {
      const index = state.deliveryPartners.findIndex(r => r.id === action.payload.id);
      if (index > -1) {
        state.deliveryPartners[index] = action.payload;
      } else {
        state.deliveryPartners.push(action.payload);
      }
    },
    simulateRiderMovement(state) {
      // Slightly shift rider latitudes/longitudes to simulate live GPS tracking
      state.deliveryPartners.forEach(r => {
        if (r.status === 'On Delivery') {
          // Move slowly towards target coordinate center (40.7128, -74.0060)
          const targetLat = 40.7128 + (Math.random() - 0.5) * 0.03;
          const targetLon = -74.0060 + (Math.random() - 0.5) * 0.03;
          
          r.latitude += (targetLat - r.latitude) * 0.1;
          r.longitude += (targetLon - r.longitude) * 0.1;
        }
      });
    },
    // Coupons
    addEditCoupon(state, action: PayloadAction<Coupon>) {
      const index = state.coupons.findIndex(c => c.id === action.payload.id);
      if (index > -1) {
        state.coupons[index] = action.payload;
      } else {
        state.coupons.push(action.payload);
      }
    },
    toggleCouponStatus(state, action: PayloadAction<string>) {
      const coupon = state.coupons.find(c => c.id === action.payload);
      if (coupon) {
        coupon.status = coupon.status === 'Active' ? 'Paused' : 'Active';
      }
    },
    // Raw materials
    adjustRawMaterialStock(state, action: PayloadAction<{ id: string; amount: number }>) {
      const mat = state.rawMaterials.find(m => m.id === action.payload.id);
      if (mat) {
        mat.stock = Math.max(0, parseFloat((mat.stock + action.payload.amount).toFixed(2)));
      }
    },
    // Support Center
    replyToTicket(state, action: PayloadAction<{ ticketId: string; text: string; sender: 'support' | 'system' }>) {
      const ticket = state.tickets.find(t => t.id === action.payload.ticketId);
      if (ticket) {
        ticket.messages.push({
          sender: action.payload.sender,
          text: action.payload.text,
          timestamp: new Date().toISOString()
        });
        if (action.payload.sender === 'support') {
          ticket.status = 'In Progress';
        }
      }
    },
    resolveTicket(state, action: PayloadAction<string>) {
      const ticket = state.tickets.find(t => t.id === action.payload);
      if (ticket) {
        ticket.status = 'Resolved';
        ticket.messages.push({
          sender: 'system',
          text: 'Ticket marked as Resolved.',
          timestamp: new Date().toISOString()
        });
      }
    },
    // Audit Logs
    addAuditLog(state, action: PayloadAction<Omit<AuditLog, 'id' | 'timestamp'>>) {
      state.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...action.payload
      });
    },
    // Customers
    updateCustomerStatus(state, action: PayloadAction<{ id: string; status: 'Active' | 'Blocked' }>) {
      const cust = state.customers.find(c => c.id === action.payload.id);
      if (cust) {
        cust.status = action.payload.status;
      }
    },
    adjustCustomerWallet(state, action: PayloadAction<{ id: string; amount: number; description: string }>) {
      const cust = state.customers.find(c => c.id === action.payload.id);
      if (cust) {
        cust.walletBalance = Math.max(0, parseFloat((cust.walletBalance + action.payload.amount).toFixed(2)));
      }
    },
    // Banners
    addEditBanner(state, action: PayloadAction<{ id: string; title: string; image: string; status: string; type: string; schedule: string }>) {
      const index = state.banners.findIndex(b => b.id === action.payload.id);
      if (index > -1) {
        state.banners[index] = action.payload;
      } else {
        state.banners.push(action.payload);
      }
    },
    deleteBanner(state, action: PayloadAction<string>) {
      state.banners = state.banners.filter(b => b.id !== action.payload);
    }
  }
});

// Configure Store
export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    auth: authSlice.reducer,
    rbac: rbacSlice.reducer,
    db: dbSlice.reducer
  }
});

// Exports Actions
export const { 
  toggleThemeMode, 
  setActiveOutlet, 
  addNotification, 
  markAllNotificationsRead, 
  clearNotifications 
} = uiSlice.actions;

export const { 
  loginRequest, 
  verify2FA, 
  logout, 
  extendSession, 
  decrementSession 
} = authSlice.actions;

export const { 
  togglePermission, 
  resetPermissions 
} = rbacSlice.actions;

export const { 
  updateOrderStatus, 
  assignRider, 
  refundOrder, 
  addEditProduct, 
  deleteProduct, 
  toggleProductAvailability,
  addEditRider,
  simulateRiderMovement,
  addEditCoupon,
  toggleCouponStatus,
  adjustRawMaterialStock,
  replyToTicket,
  resolveTicket,
  addAuditLog,
  updateCustomerStatus,
  adjustCustomerWallet,
  addEditBanner,
  deleteBanner
} = dbSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type { Product, Outlet, DeliveryPartner, Order, Coupon, RawMaterial, SupportTicket, AuditLog };
export type { Notification };
export type { UIState, AuthState };
export type { OrderItem, OrderTimeline };
export type { UserRole as Role };
