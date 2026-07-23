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

const mockSummary: DashboardSummary = {
  gross_collections: 48920.50,
  refund_settlements_amount: 1450.00,
  refund_cases: 12,
  settlement_status: 'Settled',
  gateway_breakdown: [
    { method: 'UPI (Razorpay/PhonePe)', percentage: 65, amount: 31798.32 },
    { method: 'Credit/Debit Card', percentage: 22, amount: 10762.51 },
    { method: 'App Wallet', percentage: 8, amount: 3913.64 },
    { method: 'Cash on Delivery', percentage: 5, amount: 2446.03 }
  ],
  recent_transactions: [
    { id: 'tx-501', order_id: 'order-101', customer_name: 'Marcus Aurelius', amount: 34.86, method: 'UPI', status: 'Success', date: new Date().toISOString() },
    { id: 'tx-502', order_id: 'order-102', customer_name: 'Bruce Wayne', amount: 50.39, method: 'Card', status: 'Success', date: new Date(Date.now() - 3600000).toISOString() },
    { id: 'tx-503', order_id: 'order-103', customer_name: 'Clark Kent', amount: 22.50, method: 'Wallet', status: 'Success', date: new Date(Date.now() - 7200000).toISOString() }
  ]
};

class PaymentService {
  async getSummary(): Promise<DashboardSummary> {
    try {
      const response = await api.get('/api/v1/payments/summary');
      if (response.data?.gross_collections !== undefined) return response.data;
    } catch (e) {
      console.warn("Backend payment summary failed, using mock data.", e);
    }
    return mockSummary;
  }

  async getWallet(customerId: string): Promise<WalletBalance> {
    try {
      const response = await api.get(`/api/v1/payments/wallet/${customerId}`);
      if (response.data?.wallet_balance !== undefined) return response.data;
    } catch (e) {
      console.warn("Backend wallet balance failed, using mock data.");
    }
    return {
      customer_id: customerId,
      wallet_balance: 150.00,
      lifetime_credits: 450.00,
      lifetime_debits: 300.00
    };
  }
}

export const paymentService = new PaymentService();
