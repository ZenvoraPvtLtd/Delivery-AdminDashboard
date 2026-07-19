import { api } from './api';

export interface Customer {
  id: string;
  customer_id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  alternative_number?: string;
  gender?: string;
  date_of_birth?: string;
  customer_type: string;
  status: string;
  blocked_status: boolean;
  wallet_balance: number;
  reward_points: number;
  total_orders: number;
  total_spend: number;
  last_order_date?: string;
  preferred_payment_method?: string;
  preferred_outlet?: string;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  address_type: string;
  address_line: string;
  landmark?: string;
  area?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  default_address: boolean;
}

export interface WalletTransaction {
  id: string;
  customer_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  reason: string;
  created_at: string;
}

export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  size: number;
}

class CustomerService {
  async getCustomers(page = 1, size = 20, search = '', status = '', type = '', sort = '-created_at'): Promise<PaginatedCustomers> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (type) params.append('customer_type', type);
    if (sort) params.append('sort', sort);
    
    const response = await api.get(`/api/v1/customers?${params.toString()}`);
    return response.data;
  }

  async getCustomer(id: string): Promise<Customer> {
    const response = await api.get(`/api/v1/customers/${id}`);
    return response.data;
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await api.post('/api/v1/customers/', data);
    return response.data;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const response = await api.put(`/api/v1/customers/${id}`, data);
    return response.data;
  }

  async blockCustomer(id: string): Promise<Customer> {
    const response = await api.put(`/api/v1/customers/${id}/block`);
    return response.data;
  }

  async unblockCustomer(id: string): Promise<Customer> {
    const response = await api.put(`/api/v1/customers/${id}/unblock`);
    return response.data;
  }

  async getAddresses(id: string): Promise<Address[]> {
    const response = await api.get(`/api/v1/customers/${id}/addresses`);
    return response.data;
  }

  async addAddress(id: string, data: Partial<Address>): Promise<Address> {
    const response = await api.post(`/api/v1/customers/${id}/addresses`, data);
    return response.data;
  }

  async updateAddress(customerId: string, addressId: string, data: Partial<Address>): Promise<Address> {
    const response = await api.put(`/api/v1/customers/${customerId}/addresses/${addressId}`, data);
    return response.data;
  }

  async getWalletHistory(id: string): Promise<WalletTransaction[]> {
    const response = await api.get(`/api/v1/customers/${id}/wallet/history`);
    return response.data;
  }

  async adjustWallet(id: string, amount: number, reason: string): Promise<WalletTransaction> {
    const response = await api.post(`/api/v1/customers/${id}/wallet/adjust`, { amount, reason });
    return response.data;
  }
}

export const customerService = new CustomerService();
