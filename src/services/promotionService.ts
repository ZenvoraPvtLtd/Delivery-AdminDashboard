import { api } from './api';
import { initialCoupons } from '../store/mockDb';

export interface CouponResponse {
  id: string;
  code: string;
  discountType: string;
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
  usageCount: number;
  usageLimit: number;
  targetType: string;
  status: string;
}

export interface CouponCreateRequest {
  code: string;
  discountType: string;
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  targetType: string;
  status: string;
}

export interface OfferResponse {
  id: string;
  name: string;
  details: string;
  schedule: string;
  status: string;
}

const mockOffers: OfferResponse[] = [
  { id: 'off-1', name: 'Monsoon Flash Sale 25% Off', details: 'Applicable on orders above $30 across all outlets', schedule: 'Mon-Wed 4:00 PM - 8:00 PM', status: 'Active' },
  { id: 'off-2', name: 'BOGO Weekend Special', details: 'Buy 1 Get 1 free on selected Pizzas & Burgers', schedule: 'Sat-Sun All Day', status: 'Active' }
];

class PromotionService {
  async getCoupons(): Promise<CouponResponse[]> {
    try {
      const response = await api.get('/api/v1/promotions/coupons');
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
    } catch (e) {
      console.warn("Backend coupons API failed, using mock data.", e);
    }
    return initialCoupons.map(c => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      value: c.value,
      minOrderValue: c.minOrderValue,
      maxDiscount: c.maxDiscount,
      expiryDate: c.expiryDate,
      usageCount: c.usageCount,
      usageLimit: c.usageLimit,
      targetType: c.targetType,
      status: c.status
    }));
  }

  async createCoupon(data: CouponCreateRequest): Promise<CouponResponse> {
    try {
      const response = await api.post('/api/v1/promotions/coupons', data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend create coupon failed.");
    }
    const newC: CouponResponse = {
      id: `cpn-${Date.now()}`,
      code: data.code,
      discountType: data.discountType,
      value: data.value,
      minOrderValue: data.minOrderValue,
      maxDiscount: data.maxDiscount,
      expiryDate: data.expiryDate,
      usageCount: 0,
      usageLimit: data.usageLimit,
      targetType: data.targetType,
      status: data.status
    };
    return newC;
  }

  async toggleCouponStatus(couponId: string): Promise<CouponResponse> {
    try {
      const response = await api.put(`/api/v1/promotions/coupons/${couponId}/status`);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend toggle coupon status failed.");
    }
    const cpn = initialCoupons.find(c => c.id === couponId);
    if (cpn) {
      cpn.status = cpn.status === 'Active' ? 'Paused' : 'Active';
      return cpn as CouponResponse;
    }
    throw new Error('Coupon not found');
  }

  async getOffers(): Promise<OfferResponse[]> {
    try {
      const response = await api.get('/api/v1/promotions/offers');
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
    } catch (e) {
      console.warn("Backend offers failed, using mock data.");
    }
    return mockOffers;
  }

  async toggleOfferStatus(offerId: string): Promise<OfferResponse> {
    try {
      const response = await api.put(`/api/v1/promotions/offers/${offerId}/status`);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend toggle offer status failed.");
    }
    const offer = mockOffers.find(o => o.id === offerId);
    if (offer) {
      offer.status = offer.status === 'Active' ? 'Paused' : 'Active';
      return offer;
    }
    throw new Error('Offer not found');
  }
}

export const promotionService = new PromotionService();
