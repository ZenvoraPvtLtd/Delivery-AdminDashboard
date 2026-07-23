import { api } from './api';
import { initialOrders, initialProducts } from '../store/mockDb';

export interface StatCardData {
  title: string;
  value: string;
  trend: string;
  trendType: 'up' | 'down' | 'neutral' | 'info';
  isPulse: boolean;
}

export interface ChartDataPoint {
  label: string;
  sales: number;
  orders: number;
}

export interface RecentOrderData {
  id: string;
  customer_name: string;
  outlet_name: string;
  items_summary: string;
  status: string;
  total: number;
  created_at: string;
}

const mockCards: StatCardData[] = [
  { title: "TOTAL REVENUE", value: "$48,920.00", trend: "+14.2% vs last week", trendType: "up", isPulse: false },
  { title: "ACTIVE ORDERS", value: `${initialOrders.length}`, trend: "Live Kitchen Queue", trendType: "info", isPulse: true },
  { title: "DELIVERY RATING", value: "4.8 / 5.0", trend: "+0.3% customer satisfaction", trendType: "up", isPulse: false },
  { title: "LOW STOCK ALERTS", value: "2 Items", trend: "Brioche Buns & Mushrooms", trendType: "down", isPulse: true }
];

const mockCharts = {
  revenue_chart: [
    { label: 'Mon', sales: 4200, orders: 120 },
    { label: 'Tue', sales: 5100, orders: 145 },
    { label: 'Wed', sales: 4800, orders: 130 },
    { label: 'Thu', sales: 6200, orders: 180 },
    { label: 'Fri', sales: 8900, orders: 240 },
    { label: 'Sat', sales: 11200, orders: 310 },
    { label: 'Sun', sales: 9500, orders: 260 }
  ],
  top_products: [
    { name: 'Truffle Mushroom Burger', sales: 420, revenue: 5455.80 },
    { name: 'Spicy Pepperoni Pizza', sales: 380, revenue: 6456.20 },
    { name: 'Iced Vanilla Matcha Latte', sales: 310, revenue: 1856.90 }
  ],
  outlet_performance: [
    { name: 'Downtown Central', revenue: 15480 },
    { name: 'Metro Plaza', revenue: 21300 },
    { name: 'West End Cafe', revenue: 9820 }
  ]
};

const mockRecentOrders: RecentOrderData[] = initialOrders.map(o => ({
  id: o.id,
  customer_name: o.customerName,
  outlet_name: o.outletName,
  items_summary: o.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
  status: o.status,
  total: o.total,
  created_at: o.createdAt
}));

class DashboardService {
  async getCards(): Promise<StatCardData[]> {
    try {
      const response = await api.get('/api/v1/dashboard/cards');
      const cards = response.data?.data?.cards || response.data?.cards;
      if (Array.isArray(cards) && cards.length > 0) return cards;
    } catch (e) {
      console.warn("Backend dashboard cards failed, using mock data.", e);
    }
    return mockCards;
  }

  async getCharts(timeframe: string = 'weekly'): Promise<{
    revenue_chart: ChartDataPoint[];
    top_products: any[];
    outlet_performance: any[];
  }> {
    try {
      const response = await api.get(`/api/v1/dashboard/charts?timeframe=${timeframe}`);
      if (response.data?.data?.revenue_chart?.length > 0) return response.data.data;
    } catch (e) {
      console.warn("Backend dashboard charts failed, using mock data.", e);
    }
    return mockCharts;
  }

  async getRecentOrders(): Promise<RecentOrderData[]> {
    try {
      const response = await api.get('/api/v1/dashboard/recent-orders');
      if (Array.isArray(response.data?.data) && response.data.data.length > 0) return response.data.data;
    } catch (e) {
      console.warn("Backend recent orders failed, using mock data.", e);
    }
    return mockRecentOrders;
  }

  async getRecentCustomers(): Promise<any[]> {
    try {
      const response = await api.get('/api/v1/dashboard/recent-customers');
      if (Array.isArray(response.data?.data) && response.data.data.length > 0) return response.data.data;
    } catch (e) {
      console.warn("Backend recent customers failed.");
    }
    return [];
  }

  async getRecentActivities(): Promise<any[]> {
    try {
      const response = await api.get('/api/v1/dashboard/recent-activities');
      if (Array.isArray(response.data?.data) && response.data.data.length > 0) return response.data.data;
    } catch (e) {
      console.warn("Backend recent activities failed.");
    }
    return [];
  }

  async getNotifications(): Promise<any[]> {
    try {
      const response = await api.get('/api/v1/dashboard/notifications');
      if (Array.isArray(response.data?.data) && response.data.data.length > 0) return response.data.data;
    } catch (e) {
      console.warn("Backend notifications failed.");
    }
    return [];
  }

  async getSystemStatus(): Promise<any> {
    try {
      const response = await api.get('/api/v1/dashboard/system-status');
      if (response.data?.data) return response.data.data;
    } catch (e) {
      console.warn("Backend system status failed.");
    }
    return { database: "MongoDB Atlas Connected", status: "Operational", uptime: "99.98%" };
  }
}

export const dashboardService = new DashboardService();
