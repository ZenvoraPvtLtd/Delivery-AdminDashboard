import { api } from './api';

export interface HighlightStatsResponse {
  aov: string;
  aovTrend: string;
  avgPrepTime: string;
  avgPrepTrend: string;
  avgDeliveryTime: string;
  avgDeliveryTrend: string;
  repeatCustomerRate: string;
  repeatCustomerTrend: string;
}

export interface DeliveryPerformancePoint {
  hour: string;
  prepTime: number;
  deliveryTime: number;
}

export interface CustomerCohortPoint {
  name: string;
  newCust: number;
  repeatCust: number;
}

export interface AnalyticsDashboardResponse {
  stats: HighlightStatsResponse;
  deliveryPerformance: DeliveryPerformancePoint[];
  repeatCustomersData: CustomerCohortPoint[];
}

export interface ExportRequest {
  reportType: string;
  format: string;
}

export interface ExportResponse {
  status: string;
  message: string;
  export_id: string;
}

class AnalyticsService {
  async getDashboardData(): Promise<AnalyticsDashboardResponse> {
    const response = await api.get('/api/v1/analytics/dashboard');
    return response.data;
  }

  async exportReport(data: ExportRequest): Promise<ExportResponse> {
    const response = await api.post('/api/v1/analytics/export', data);
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
