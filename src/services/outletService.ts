import { api } from './api';
import { Outlet, initialOutlets } from '../store/mockDb';

class OutletService {
  async getOutlets(): Promise<Outlet[]> {
    try {
      const response = await api.get('/api/v1/outlets');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      console.warn("Backend outlets API failed, using mock data.", e);
    }
    return initialOutlets;
  }

  async createOutlet(data: Partial<Outlet>): Promise<Outlet> {
    try {
      const response = await api.post('/api/v1/outlets', data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend create outlet failed.");
    }
    const newOut: Outlet = {
      id: `out-${Date.now()}`,
      name: data.name || 'New Outlet',
      address: data.address || 'Sample Address',
      manager: data.manager || 'Manager',
      phone: data.phone || '+1 555-0000',
      status: data.status as any || 'Open',
      revenue: 0,
      ordersCount: 0,
      taxNumber: data.taxNumber || 'GST-33AABCC1234D',
      hours: data.hours || '08:00 AM - 11:00 PM'
    };
    initialOutlets.push(newOut);
    return newOut;
  }

  async updateOutlet(id: string, data: Partial<Outlet>): Promise<Outlet> {
    try {
      const response = await api.put(`/api/v1/outlets/${id}`, data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend update outlet failed.");
    }
    const out = initialOutlets.find(o => o.id === id);
    if (out) Object.assign(out, data);
    return out || (data as Outlet);
  }
}

export const outletService = new OutletService();
