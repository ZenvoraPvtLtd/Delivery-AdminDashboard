import { api } from './api';

export interface BannerResponse {
  id: string;
  title: string;
  image: string;
  status: string;
  type: string;
  schedule: string;
}

export interface BannerCreateRequest {
  title: string;
  image: string;
  status: string;
  type: string;
  schedule: string;
}

export interface CMSPageResponse {
  aboutUs: string;
  privacyPolicy: string;
  faqs: Array<{ q: string; a: string }>;
}

export interface CMSPageUpdateRequest {
  aboutUs: string;
  privacyPolicy: string;
}

class CMSService {
  async getBanners(): Promise<BannerResponse[]> {
    const response = await api.get('/api/v1/cms/banners');
    return response.data;
  }

  async createBanner(data: BannerCreateRequest): Promise<BannerResponse> {
    const response = await api.post('/api/v1/cms/banners', data);
    return response.data;
  }

  async deleteBanner(bannerId: string): Promise<void> {
    await api.delete(`/api/v1/cms/banners/${bannerId}`);
  }

  async toggleBannerStatus(bannerId: string): Promise<BannerResponse> {
    const response = await api.put(`/api/v1/cms/banners/${bannerId}/status`);
    return response.data;
  }

  async getPages(): Promise<CMSPageResponse> {
    const response = await api.get('/api/v1/cms/pages');
    return response.data;
  }

  async updatePages(data: CMSPageUpdateRequest): Promise<CMSPageResponse> {
    const response = await api.put('/api/v1/cms/pages', data);
    return response.data;
  }
}

export const cmsService = new CMSService();
