import { api } from './api';

export interface DashboardSummary {
  gross_collections: number;
  refund_settlements_amount: number;
  refund_cases: number;
  settlement_status: string;
  gateway_breakdown: any[];
  recent_transactions: any[];
}

export interface WalletBalance {
  customer_id: string;
  wallet_balance: number;
  lifetime_credits: number;
  lifetime_debits: number;
}

class PaymentService {
  async getSummary(): Promise<DashboardSummary> {
    const response = await api.get('/api/v1/payments/summary');
    return response.data;
  }

  async getWallet(customerId: string): Promise<WalletBalance> {
    const response = await api.get(`/api/v1/payments/wallet/${customerId}`);
    return response.data;
  }
}

export const paymentService = new PaymentService();
