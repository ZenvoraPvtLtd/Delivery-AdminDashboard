import { api } from './api';
import { Order, initialOrders } from '../store/mockDb';

class OrderService {
  async getOrders(params?: { search?: string; status?: string; paymentStatus?: string; outletId?: string }): Promise<Order[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.paymentStatus) queryParams.append('payment_status', params.paymentStatus);
      if (params?.outletId) queryParams.append('outlet_id', params.outletId);

      const response = await api.get(`/api/v1/orders?${queryParams.toString()}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      console.warn("Backend orders API failed, using mock data.", e);
    }
    return initialOrders;
  }

  async getOrder(id: string): Promise<Order> {
    try {
      const response = await api.get(`/api/v1/orders/${id}`);
      if (response.data?.id || response.data?.order_id) return response.data;
    } catch (e) {
      console.warn("Backend get order failed, using mock data.");
    }
    const ord = initialOrders.find(o => o.id === id);
    if (ord) return ord;
    throw new Error("Order not found");
  }

  async updateStatus(id: string, status: string, updatedBy: string = 'Admin'): Promise<void> {
    try {
      await api.put(`/api/v1/orders/${id}/status`, { status, updatedBy });
    } catch (e) {
      console.warn("Backend update status failed.");
    }
    const ord = initialOrders.find(o => o.id === id);
    if (ord) {
      ord.status = status as any;
      if (status === 'Delivered') ord.paymentStatus = 'Paid';
      else if (status === 'Cancelled') ord.paymentStatus = 'Refunded';
    }
  }

  async assignRider(orderId: string, riderId: string, updatedBy: string = 'Admin'): Promise<void> {
    try {
      await api.post('/api/v1/orders/assign-rider', { orderId, riderId, updatedBy });
    } catch (e) {
      console.warn("Backend assign rider failed.");
    }
    const ord = initialOrders.find(o => o.id === orderId);
    if (ord) {
      ord.deliveryPartnerId = riderId;
      ord.status = 'Out for Delivery';
    }
  }

  async refundOrder(orderId: string, reason: string, updatedBy: string = 'Admin'): Promise<void> {
    try {
      await api.post('/api/v1/orders/refund', { orderId, reason, updatedBy });
    } catch (e) {
      console.warn("Backend refund order failed.");
    }
    const ord = initialOrders.find(o => o.id === orderId);
    if (ord) {
      ord.paymentStatus = 'Refunded';
      ord.status = 'Cancelled';
    }
  }
}

export const orderService = new OrderService();
