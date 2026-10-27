import { apiClient } from './client';
import {
  Brand,
  CatalogFacets,
  Category,
  PaginatedResponse,
  ProductDetail,
  ProductListItem,
} from '../types';

export interface CatalogQueryFilters {
  search?: string;
  brand?: string[];
  category?: string[];
  gender?: string[];
  size?: string[];
  color?: string[];
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  featured?: boolean;
  sort?: string;
  page?: number;
  page_size?: number;
}

export const fetchProducts = async (
  filters: CatalogQueryFilters = {}
): Promise<PaginatedResponse<ProductListItem>> => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.page_size) params.append('page_size', String(filters.page_size));
  if (filters.min_price !== undefined) params.append('min_price', String(filters.min_price));
  if (filters.max_price !== undefined) params.append('max_price', String(filters.max_price));
  if (filters.in_stock) params.append('in_stock', 'true');
  if (filters.featured !== undefined) params.append('featured', String(filters.featured));

  filters.brand?.forEach((b) => params.append('brand', b));
  filters.category?.forEach((c) => params.append('category', c));
  filters.gender?.forEach((g) => params.append('gender', g));
  filters.size?.forEach((s) => params.append('size', s));
  filters.color?.forEach((c) => params.append('color', c));

  const response = await apiClient.get<PaginatedResponse<ProductListItem>>('/products', { params });
  return response.data;
};

export const fetchCatalogFacets = async (): Promise<CatalogFacets> => {
  const response = await apiClient.get<CatalogFacets>('/products/facets');
  return response.data;
};

export const fetchFeaturedProducts = async (limit: number = 8): Promise<ProductListItem[]> => {
  const response = await apiClient.get<ProductListItem[]>('/products/featured', {
    params: { limit },
  });
  return response.data;
};

export const fetchProductDetail = async (identifier: string): Promise<ProductDetail> => {
  const response = await apiClient.get<ProductDetail>(`/products/${identifier}`);
  return response.data;
};

export const fetchRelatedProducts = async (
  productId: string,
  limit: number = 4
): Promise<ProductListItem[]> => {
  const response = await apiClient.get<ProductListItem[]>(`/products/${productId}/related`, {
    params: { limit },
  });
  return response.data;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/categories');
  return response.data;
};

export const fetchBrands = async (): Promise<Brand[]> => {
  const response = await apiClient.get<Brand[]>('/brands');
  return response.data;
};
