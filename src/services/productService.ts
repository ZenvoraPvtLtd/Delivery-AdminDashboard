import { api } from './api';
import { Product } from '../store'; // Adjust import if needed

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  size: number;
}

class ProductService {
  async getProducts(
    page = 1, 
    size = 20, 
    search = '', 
    category = 'All', 
    vegFilter = 'All', 
    menuSchedule = 'All'
  ): Promise<PaginatedProducts> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    if (vegFilter && vegFilter !== 'All') params.append('veg_filter', vegFilter);
    if (menuSchedule && menuSchedule !== 'All') params.append('menu_schedule', menuSchedule);
    
    const response = await api.get(`/api/v1/products?${params.toString()}`);
    return response.data;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await api.post('/api/v1/products/', data);
    return response.data;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await api.put(`/api/v1/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/v1/products/${id}`);
  }

  async toggleAvailability(id: string, availability: boolean): Promise<Product> {
    const response = await api.put(`/api/v1/products/${id}/availability`, { availability });
    return response.data;
  }
}

export const productService = new ProductService();
