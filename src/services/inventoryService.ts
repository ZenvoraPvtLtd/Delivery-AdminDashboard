import { api } from './api';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock_alert: number;
  supplier: string;
  expiry_date?: string;
}

export interface PurchaseOrder {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  supplier_name: string;
  status: string;
  date: string;
}

export interface PaginatedInventory {
  data: InventoryItem[];
  total: number;
  page: number;
  size: number;
}

class InventoryService {
  async getInventory(page = 1, size = 20, search = '', category = 'All'): Promise<PaginatedInventory> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    
    const response = await api.get(`/api/v1/inventory?${params.toString()}`);
    return response.data;
  }

  async adjustStock(id: string, amount: number): Promise<{ current_stock: number }> {
    const response = await api.post(`/api/v1/inventory/${id}/adjust`, { amount });
    return response.data;
  }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const response = await api.get('/api/v1/inventory/purchase-orders');
    return response.data;
  }

  async issuePurchaseOrder(item: string, qty: number, supplier: string): Promise<PurchaseOrder> {
    const response = await api.post('/api/v1/inventory/purchase-orders', { item, qty, supplier });
    return response.data;
  }
}

export const inventoryService = new InventoryService();
