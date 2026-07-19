import { api } from './api';

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

class PromotionService {
  async getCoupons(): Promise<CouponResponse[]> {
    const response = await api.get('/api/v1/promotions/coupons');
    return response.data;
  }

  async createCoupon(data: CouponCreateRequest): Promise<CouponResponse> {
    const response = await api.post('/api/v1/promotions/coupons', data);
    return response.data;
  }

  async toggleCouponStatus(couponId: string): Promise<CouponResponse> {
    const response = await api.put(`/api/v1/promotions/coupons/${couponId}/status`);
    return response.data;
  }

  async getOffers(): Promise<OfferResponse[]> {
    const response = await api.get('/api/v1/promotions/offers');
    return response.data;
  }

  async toggleOfferStatus(offerId: string): Promise<OfferResponse> {
    const response = await api.put(`/api/v1/promotions/offers/${offerId}/status`);
    return response.data;
  }
}

export const promotionService = new PromotionService();
