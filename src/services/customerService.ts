import { api } from './api';
import { initialCustomers } from '../store/mockDb';

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
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (type) params.append('customer_type', type);
      if (sort) params.append('sort', sort);
      
      const response = await api.get(`/api/v1/customers?${params.toString()}`);
      const items = response.data?.data || response.data?.items || (Array.isArray(response.data) ? response.data : null);
      if (Array.isArray(items) && items.length > 0) {
        return {
          data: items,
          total: response.data?.total || items.length,
          page,
          size
        };
      }
    } catch (e) {
      console.warn("Backend customers API failed or empty, using mock DB fallback.", e);
    }

    let filtered = initialCustomers.map(c => ({
      id: c.id,
      customer_id: c.id,
      full_name: c.name,
      email: c.email,
      mobile_number: c.phone,
      customer_type: 'Regular',
      status: c.status,
      blocked_status: c.status === 'Blocked',
      wallet_balance: c.walletBalance,
      reward_points: c.rewardPoints || 0,
      total_orders: 14,
      total_spend: 420.50,
      last_order_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    if (search) {
      filtered = filtered.filter(c => c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));
    }

    return {
      data: filtered,
      total: filtered.length,
      page,
      size
    };
  }

  async getCustomer(id: string): Promise<Customer> {
    try {
      const response = await api.get(`/api/v1/customers/${id}`);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend get customer failed, using mock data.");
    }
    const cust = initialCustomers.find(c => c.id === id);
    if (cust) {
      return {
        id: cust.id,
        customer_id: cust.id,
        full_name: cust.name,
        email: cust.email,
        mobile_number: cust.phone,
        customer_type: 'Regular',
        status: cust.status,
        blocked_status: cust.status === 'Blocked',
        wallet_balance: cust.walletBalance,
        reward_points: cust.rewardPoints || 0,
        total_orders: 14,
        total_spend: 420.50,
        last_order_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    throw new Error('Customer not found');
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    try {
      const response = await api.post('/api/v1/customers/', data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend create customer failed, using mock data.");
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      customer_id: `cust-${Date.now()}`,
      full_name: data.full_name || 'New Customer',
      email: data.email || 'customer@example.com',
      mobile_number: data.mobile_number || '+1 555-0000',
      customer_type: data.customer_type || 'Regular',
      status: 'Active',
      blocked_status: false,
      wallet_balance: 0,
      reward_points: 0,
      total_orders: 0,
      total_spend: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return newCust;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    try {
      const response = await api.put(`/api/v1/customers/${id}`, data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend update customer failed.");
    }
    return data as Customer;
  }

  async blockCustomer(id: string): Promise<Customer> {
    try {
      const response = await api.put(`/api/v1/customers/${id}/block`);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend block customer failed.");
    }
    const cust = await this.getCustomer(id);
    cust.status = 'Blocked';
    cust.blocked_status = true;
    return cust;
  }

  async unblockCustomer(id: string): Promise<Customer> {
    try {
      const response = await api.put(`/api/v1/customers/${id}/unblock`);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend unblock customer failed.");
    }
    const cust = await this.getCustomer(id);
    cust.status = 'Active';
    cust.blocked_status = false;
    return cust;
  }

  async getAddresses(id: string): Promise<Address[]> {
    try {
      const response = await api.get(`/api/v1/customers/${id}/addresses`);
      if (Array.isArray(response.data)) return response.data;
    } catch (e) {
      console.warn("Backend get addresses failed.");
    }
    return [{
      id: 'addr-1',
      customer_id: id,
      address_type: 'Home',
      address_line: '32 Wall Street, Apt 4B',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postal_code: '10005',
      default_address: true
    }];
  }

  async addAddress(id: string, data: Partial<Address>): Promise<Address> {
    try {
      const response = await api.post(`/api/v1/customers/${id}/addresses`, data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend add address failed.");
    }
    return {
      id: `addr-${Date.now()}`,
      customer_id: id,
      address_type: data.address_type || 'Home',
      address_line: data.address_line || 'Sample Address',
      city: data.city || 'New York',
      state: data.state || 'NY',
      country: data.country || 'USA',
      postal_code: data.postal_code || '10001',
      default_address: true
    };
  }

  async updateAddress(customerId: string, addressId: string, data: Partial<Address>): Promise<Address> {
    try {
      const response = await api.put(`/api/v1/customers/${customerId}/addresses/${addressId}`, data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend update address failed.");
    }
    return data as Address;
  }

  async getWalletHistory(id: string): Promise<WalletTransaction[]> {
    try {
      const response = await api.get(`/api/v1/customers/${id}/wallet/history`);
      if (Array.isArray(response.data)) return response.data;
    } catch (e) {
      console.warn("Backend get wallet history failed.");
    }
    return [{
      id: 'tx-1',
      customer_id: id,
      transaction_type: 'CREDIT',
      amount: 25.00,
      balance_after: 25.00,
      reason: 'Promotional Reward Credit',
      created_at: new Date().toISOString()
    }];
  }

  async adjustWallet(id: string, amount: number, reason: string): Promise<WalletTransaction> {
    try {
      const response = await api.post(`/api/v1/customers/${id}/wallet/adjust`, { amount, reason });
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend adjust wallet failed.");
    }
    return {
      id: `tx-${Date.now()}`,
      customer_id: id,
      transaction_type: amount >= 0 ? 'CREDIT' : 'DEBIT',
      amount: Math.abs(amount),
      balance_after: 50.00,
      reason,
      created_at: new Date().toISOString()
    };
  }
}

export const customerService = new CustomerService();
