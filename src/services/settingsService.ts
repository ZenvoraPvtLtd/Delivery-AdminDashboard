import { api } from './api';

export interface BusinessSettingResponse {
  deliveryFee: string;
  packagingFee: string;
  businessHours: string;
}

export interface ApiConfigurationResponse {
  googleMaps: boolean;
  razorpay: boolean;
  twilio: boolean;
  smtp: boolean;
}

export interface BackupResponse {
  id: string;
  size: string;
  status: string;
  date: string;
}

export interface EmailTemplateResponse {
  type: string;
  subject: string;
  body: string;
}

export interface SmsTemplateResponse {
  type: string;
  message: string;
}

export interface ProviderResponse {
  name: string;
  isActive: boolean;
}

export interface CommunicationDataResponse {
  emailTemplates: EmailTemplateResponse[];
  smsTemplates: SmsTemplateResponse[];
  providers: ProviderResponse[];
}

class SettingsService {
  async getBusinessSettings(): Promise<BusinessSettingResponse> {
    const res = await api.get('/api/v1/settings/business');
    return res.data;
  }

  async updateBusinessSettings(data: BusinessSettingResponse): Promise<BusinessSettingResponse> {
    const res = await api.put('/api/v1/settings/business', data);
    return res.data;
  }

  async getApiConfigs(): Promise<ApiConfigurationResponse> {
    const res = await api.get('/api/v1/settings/apis');
    return res.data;
  }

  async toggleApiConfig(key: string, value: boolean): Promise<ApiConfigurationResponse> {
    const res = await api.put(`/api/v1/settings/apis/toggle?key=${encodeURIComponent(key)}&value=${value}`);
    return res.data;
  }

  async getBackups(): Promise<BackupResponse[]> {
    const res = await api.get('/api/v1/settings/backups');
    return res.data;
  }

  async triggerBackup(): Promise<BackupResponse> {
    const res = await api.post('/api/v1/settings/backups');
    return res.data;
  }

  async getCommunicationData(): Promise<CommunicationDataResponse> {
    const res = await api.get('/api/v1/settings/communication');
    return res.data;
  }

  async updateEmailTemplate(typeName: string, subject: string, body: string): Promise<CommunicationDataResponse> {
    const res = await api.put(`/api/v1/settings/communication/templates/${encodeURIComponent(typeName)}`, { subject, body });
    return res.data;
  }

  async toggleProvider(name: string): Promise<CommunicationDataResponse> {
    const res = await api.put(`/api/v1/settings/communication/providers/${encodeURIComponent(name)}/toggle`);
    return res.data;
  }
}

export const settingsService = new SettingsService();
