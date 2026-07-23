import { api } from './api';
import { initialRawMaterials, RawMaterial } from '../store/mockDb';

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

const mockPurchaseOrders: PurchaseOrder[] = [
  { id: 'po-101', item_name: 'Truffle Oil 5L', quantity: 10, unit: 'liters', supplier_name: 'Italian Imports Co', status: 'Pending Approval', date: '2026-07-22' },
  { id: 'po-102', item_name: 'Organic Haas Avocados', quantity: 50, unit: 'kg', supplier_name: 'Fresh Farms Organics', status: 'Dispatched', date: '2026-07-21' },
  { id: 'po-103', item_name: 'Sourdough Flour Bags', quantity: 200, unit: 'kg', supplier_name: 'Golden Grain Mills', status: 'Delivered', date: '2026-07-19' }
];

class InventoryService {
  async getInventory(page = 1, size = 20, search = '', category = 'All'): Promise<PaginatedInventory> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      if (search) params.append('search', search);
      if (category && category !== 'All') params.append('category', category);
      
      const response = await api.get(`/api/v1/inventory?${params.toString()}`);
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
      console.warn("Backend inventory endpoint offline or empty, using mock DB fallback.", e);
    }

    let filtered = initialRawMaterials.map((item: RawMaterial) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_stock: item.stock,
      min_stock_alert: item.minStockAlert,
      supplier: item.supplier,
      expiry_date: item.expiryDate
    }));

    if (search) {
      filtered = filtered.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (category && category !== 'All') {
      filtered = filtered.filter(i => i.category === category);
    }

    return {
      data: filtered,
      total: filtered.length,
      page,
      size
    };
  }

  async adjustStock(id: string, amount: number): Promise<{ current_stock: number }> {
    try {
      const response = await api.post(`/api/v1/inventory/${id}/adjust`, { amount });
      if (response.data?.current_stock !== undefined) return response.data;
    } catch (e) {
      console.warn("Backend adjust stock failed, using local mock.");
    }
    const item = initialRawMaterials.find(i => i.id === id);
    if (item) {
      item.stock = Math.max(0, parseFloat((item.stock + amount).toFixed(2)));
      return { current_stock: item.stock };
    }
    return { current_stock: 0 };
  }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const response = await api.get('/api/v1/inventory/purchase-orders');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      console.warn("Backend purchase orders failed, using mock data.");
    }
    return mockPurchaseOrders;
  }

  async issuePurchaseOrder(item: string, qty: number, supplier: string): Promise<PurchaseOrder> {
    try {
      const response = await api.post('/api/v1/inventory/purchase-orders', { item, qty, supplier });
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend issue purchase order failed, using local mock.");
    }
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      item_name: item,
      quantity: qty,
      unit: 'pcs',
      supplier_name: supplier,
      status: 'Pending Approval',
      date: new Date().toISOString().split('T')[0]
    };
    mockPurchaseOrders.unshift(newPo);
    return newPo;
  }
}

export const inventoryService = new InventoryService();
