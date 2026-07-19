import { api } from './api';

export interface DeliveryPartner {
  id: string;
  partner_id: string;
  full_name: string;
  mobile_number: string;
  email?: string;
  status: string;
  verification_status: string;
  license_verified: boolean;
  rating: number;
  total_earnings: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPartnerDetail extends DeliveryPartner {
  assigned_orders: string[];
  current_active_order?: string;
  completed_deliveries: number;
  cancelled_deliveries: number;
  pending_deliveries: number;
}

export interface PaginatedDeliveryPartners {
  data: DeliveryPartner[];
  total: number;
  page: number;
  size: number;
}

export interface DeliveryPartnerStats {
  total_riders: number;
  available_riders: number;
  busy_riders: number;
  offline_riders: number;
}

class DeliveryPartnerService {
  async getPartners(page = 1, size = 20, search = '', status = '', sort = '-created_at'): Promise<PaginatedDeliveryPartners> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    if (status && status !== 'All') params.append('status', status);
    if (sort) params.append('sort', sort);
    
    const response = await api.get(`/api/v1/delivery-partners?${params.toString()}`);
    return response.data;
  }

  async getSummaryStats(): Promise<DeliveryPartnerStats> {
    const response = await api.get('/api/v1/delivery-partners/summary');
    return response.data.data;
  }

  async getPartner(id: string): Promise<DeliveryPartnerDetail> {
    const response = await api.get(`/api/v1/delivery-partners/${id}`);
    return response.data;
  }

  async createPartner(data: any): Promise<DeliveryPartner> {
    const response = await api.post('/api/v1/delivery-partners/', data);
    return response.data;
  }

  async updateDutyStatus(id: string, status: string): Promise<DeliveryPartner> {
    const response = await api.put(`/api/v1/delivery-partners/${id}/duty`, { status });
    return response.data;
  }

  async verifyLicense(id: string, verified: boolean): Promise<DeliveryPartner> {
    const response = await api.put(`/api/v1/delivery-partners/${id}/verify-license`, { verified });
    return response.data;
  }
}

export const deliveryPartnerService = new DeliveryPartnerService();
