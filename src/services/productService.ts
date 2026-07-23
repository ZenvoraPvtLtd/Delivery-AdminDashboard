import { api } from './api';
import { Product, initialProducts } from '../store/mockDb';

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
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      if (search) params.append('search', search);
      if (category && category !== 'All') params.append('category', category);
      if (vegFilter && vegFilter !== 'All') params.append('veg_filter', vegFilter);
      if (menuSchedule && menuSchedule !== 'All') params.append('menu_schedule', menuSchedule);
      
      const response = await api.get(`/api/v1/products?${params.toString()}`);
      const items = response.data?.data || response.data?.items || (Array.isArray(response.data) ? response.data : null);
      if (Array.isArray(items) && items.length > 0) {
        return {
          data: items,
          total: response.data?.total || items.length,
          page,
          size
        };
      }
    } catch (error) {
      console.warn('Backend products endpoint offline or empty, falling back to mock DB data.', error);
    }

    let filtered = [...initialProducts];
    if (search) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category === category);
    }
    if (vegFilter !== 'All') {
      filtered = filtered.filter(p => vegFilter === 'Veg' ? p.isVeg : !p.isVeg);
    }
    return {
      data: filtered,
      total: filtered.length,
      page,
      size
    };
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    try {
      const response = await api.post('/api/v1/products/', data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend create product failed, using mock data.", e);
    }
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: data.name || 'New Product',
      category: data.category || 'Fast Food',
      subcategory: data.subcategory || '',
      price: data.price || 9.99,
      discount: data.discount || 0,
      availability: data.availability ?? true,
      preparationTime: data.preparationTime || 10,
      isVeg: data.isVeg ?? true,
      isBestSeller: data.isBestSeller ?? false,
      image: data.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      outletIds: data.outletIds || ['out-1'],
      gstRate: data.gstRate || 5,
      description: data.description || ''
    };
    initialProducts.push(newProd);
    return newProd;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    try {
      const response = await api.put(`/api/v1/products/${id}`, data);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend update product failed, using mock data.", e);
    }
    const prod = initialProducts.find(p => p.id === id);
    if (prod) Object.assign(prod, data);
    return prod || (data as Product);
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/products/${id}`);
    } catch (e) {
      console.warn("Backend delete product failed.");
    }
    const index = initialProducts.findIndex(p => p.id === id);
    if (index > -1) initialProducts.splice(index, 1);
  }

  async toggleAvailability(id: string, availability: boolean): Promise<Product> {
    try {
      const response = await api.put(`/api/v1/products/${id}/availability`, { availability });
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend toggle availability failed.");
    }
    const prod = initialProducts.find(p => p.id === id);
    if (prod) prod.availability = availability;
    return prod || ({ id, availability } as Product);
  }
}

export const productService = new ProductService();
