import { api } from './api';
import { initialDeliveryPartners } from '../store/mockDb';

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
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      if (search) params.append('search', search);
      if (status && status !== 'All') params.append('status', status);
      if (sort) params.append('sort', sort);
      
      const response = await api.get(`/api/v1/delivery-partners?${params.toString()}`);
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
      console.warn("Backend delivery partners API failed or empty, using mock DB fallback.", e);
    }

    let filtered = initialDeliveryPartners.map(r => ({
      id: r.id,
      partner_id: r.id,
      full_name: r.name,
      mobile_number: r.phone,
      email: `${r.name.toLowerCase().replace(/\s+/g, '.')}@delivo.com`,
      status: r.status,
      verification_status: r.licenseVerified ? 'Verified' : 'Pending',
      license_verified: r.licenseVerified,
      rating: r.rating,
      total_earnings: r.earnings,
      wallet_balance: 150.00,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    if (search) {
      filtered = filtered.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()));
    }
    if (status && status !== 'All') {
      filtered = filtered.filter(p => p.status === status);
    }

    return {
      data: filtered,
      total: filtered.length,
      page,
      size
    };
  }

  async getSummaryStats(): Promise<DeliveryPartnerStats> {
    try {
      const response = await api.get('/api/v1/delivery-partners/summary');
      if (response.data?.data?.total_riders) return response.data.data;
    } catch (e) {
      console.warn("Backend summary stats failed.");
    }
    return {
      total_riders: initialDeliveryPartners.length,
      available_riders: initialDeliveryPartners.filter(r => r.status === 'Available').length,
      busy_riders: initialDeliveryPartners.filter(r => r.status === 'On Delivery').length,
      offline_riders: initialDeliveryPartners.filter(r => r.status === 'Offline').length
    };
  }

  async getPartner(id: string): Promise<DeliveryPartnerDetail> {
    try {
      const response = await api.get(`/api/v1/delivery-partners/${id}`);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend get partner failed.");
    }
    const rider = initialDeliveryPartners.find(r => r.id === id);
    return {
      id: id,
      partner_id: id,
      full_name: rider?.name || 'Rider',
      mobile_number: rider?.phone || '+1 555-0000',
      status: rider?.status || 'Available',
      verification_status: rider?.licenseVerified ? 'Verified' : 'Pending',
      license_verified: rider?.licenseVerified ?? true,
      rating: rider?.rating || 4.8,
      total_earnings: rider?.earnings || 350.00,
      wallet_balance: 120.00,
      assigned_orders: rider?.assignedOrderId ? [rider.assignedOrderId] : [],
      current_active_order: rider?.assignedOrderId,
      completed_deliveries: 142,
      cancelled_deliveries: 2,
      pending_deliveries: rider?.assignedOrderId ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async createPartner(data: any): Promise<DeliveryPartner> {
    try {
      const response = await api.post('/api/v1/delivery-partners/', data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend create partner failed.");
    }
    return {
      id: `rider-${Date.now()}`,
      partner_id: `rider-${Date.now()}`,
      full_name: data.full_name || 'New Rider',
      mobile_number: data.mobile_number || '+1 555-0000',
      status: 'Available',
      verification_status: 'Verified',
      license_verified: true,
      rating: 5.0,
      total_earnings: 0,
      wallet_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async updateDutyStatus(id: string, status: string): Promise<DeliveryPartner> {
    try {
      const response = await api.put(`/api/v1/delivery-partners/${id}/duty`, { status });
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend update duty status failed.");
    }
    const partner = await this.getPartner(id);
    partner.status = status;
    return partner;
  }

  async verifyLicense(id: string, verified: boolean): Promise<DeliveryPartner> {
    try {
      const response = await api.put(`/api/v1/delivery-partners/${id}/verify-license`, { verified });
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend verify license failed.");
    }
    const partner = await this.getPartner(id);
    partner.license_verified = verified;
    return partner;
  }
}

export const deliveryPartnerService = new DeliveryPartnerService();
