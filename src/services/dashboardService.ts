import { api } from './api';

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

class DashboardService {
  async getOverview() {
    const response = await api.get('/api/v1/dashboard/overview');
    return response.data.data;
  }

  async getCards(): Promise<StatCardData[]> {
    const response = await api.get('/api/v1/dashboard/cards');
    return response.data.data.cards;
  }

  async getCharts(timeframe: string = 'weekly'): Promise<{
    revenue_chart: ChartDataPoint[];
    top_products: any[];
    outlet_performance: any[];
  }> {
    const response = await api.get(`/api/v1/dashboard/charts?timeframe=${timeframe}`);
    return response.data.data;
  }

  async getRecentOrders(): Promise<RecentOrderData[]> {
    const response = await api.get('/api/v1/dashboard/recent-orders');
    return response.data.data;
  }

  async getRecentCustomers(): Promise<any[]> {
    const response = await api.get('/api/v1/dashboard/recent-customers');
    return response.data.data;
  }

  async getRecentActivities(): Promise<any[]> {
    const response = await api.get('/api/v1/dashboard/recent-activities');
    return response.data.data;
  }

  async getNotifications(): Promise<any[]> {
    const response = await api.get('/api/v1/dashboard/notifications');
    return response.data.data;
  }

  async getSystemStatus(): Promise<any> {
    const response = await api.get('/api/v1/dashboard/system-status');
    return response.data.data;
  }
}

export const dashboardService = new DashboardService();
