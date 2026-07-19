import { api } from './api';

export interface KpiCardsResponse {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  waDelivered: number;
  smsDelivered: number;
  waFailed: number;
  smsFailed: number;
  awaitingReply: number;
  avgConfirmTime: number;
  confirmationRate: number;
}

export interface AnalyticsDataResponse {
  waSuccessRate: number;
  smsSuccessRate: number;
  cancellationReasons: { name: string; value: number }[];
}

export interface DashboardAnalyticsResponse {
  cards: KpiCardsResponse;
  analytics: AnalyticsDataResponse;
}

export interface ConversationLogResponse {
  id: string;
  order_id: string;
  type: string;
  body: string;
  status: string;
  timestamp: string;
}

class OrderConfirmationService {
  async getAnalytics(): Promise<DashboardAnalyticsResponse> {
    const res = await api.get('/api/v1/analytics/order-confirmation');
    return res.data;
  }

  async forceConfirm(orderId: string): Promise<void> {
    await api.post('/api/v1/orders/confirm', { orderId });
  }

  async forceCancel(orderId: string, reason: string): Promise<void> {
    await api.post('/api/v1/orders/cancel', { orderId, reason });
  }

  async resendConfirmation(orderId: string, channel: string): Promise<void> {
    await api.post('/api/v1/orders/resend', { orderId, channel });
  }

  async simulateTimeLeap(orderId: string, hours: number): Promise<void> {
    await api.post('/api/v1/orders/simulate-time-leap', { orderId, hours });
  }

  async getConversations(orderId: string): Promise<ConversationLogResponse[]> {
    const res = await api.get(`/api/v1/orders/conversations/${orderId}`);
    return res.data;
  }

  async sendSimulatedWebhook(channel: 'whatsapp' | 'sms', fromNumber: string, body: string): Promise<void> {
    const endpoint = channel === 'whatsapp' ? '/api/v1/webhook/whatsapp' : '/api/v1/webhook/sms';
    await api.post(endpoint, { From: fromNumber, Body: body });
  }
}

export const orderConfirmationService = new OrderConfirmationService();
