import { apiClient } from './client';

export interface AdminStatsData {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  total_products: number;
  total_customers: number;
  low_stock_count: number;
  recent_orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
  }>;
}

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  item_count: number;
  customer_name: string;
  customer_email: string;
  created_at: string;
  tracking_number?: string;
}

export interface AdminReviewListItem {
  id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface CouponItem {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  max_uses?: number;
  times_used: number;
  is_active: boolean;
  created_at: string;
}

export const fetchAdminStats = async (): Promise<AdminStatsData> => {
  const { data } = await apiClient.get<AdminStatsData>('/admin/stats');
  return data;
};

export const fetchAdminOrders = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}): Promise<{ items: AdminOrderListItem[]; total: number; page: number; total_pages: number }> => {
  const { data } = await apiClient.get('/admin/orders', { params });
  return data;
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  adminNotes?: string
): Promise<any> => {
  const { data } = await apiClient.put(`/orders/${orderId}/status`, {
    status,
    admin_notes: adminNotes,
  });
  return data;
};

export const fetchAdminReviews = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<{ items: AdminReviewListItem[]; total: number; page: number; total_pages: number }> => {
  const { data } = await apiClient.get('/admin/reviews', { params });
  return data;
};

export const updateReviewStatus = async (reviewId: string, status: string): Promise<any> => {
  const { data } = await apiClient.put(`/admin/reviews/${reviewId}/status`, { status });
  return data;
};

export const deleteReview = async (reviewId: string): Promise<any> => {
  const { data } = await apiClient.delete(`/admin/reviews/${reviewId}`);
  return data;
};

export const fetchAdminCoupons = async (): Promise<CouponItem[]> => {
  const { data } = await apiClient.get<CouponItem[]>('/admin/coupons');
  return data;
};

export const createAdminCoupon = async (payload: {
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  max_uses?: number;
}): Promise<CouponItem> => {
  const { data } = await apiClient.post<CouponItem>('/admin/coupons', payload);
  return data;
};

export const deleteAdminCoupon = async (couponId: string): Promise<any> => {
  const { data } = await apiClient.delete(`/admin/coupons/${couponId}`);
  return data;
};

export const createAdminProduct = async (payload: any): Promise<any> => {
  const { data } = await apiClient.post('/admin/products', payload);
  return data;
};

export const updateAdminProduct = async (productId: string, payload: any): Promise<any> => {
  const { data } = await apiClient.put(`/admin/products/${productId}`, payload);
  return data;
};

export const deleteAdminProduct = async (productId: string): Promise<any> => {
  const { data } = await apiClient.delete(`/admin/products/${productId}`);
  return data;
};

export const uploadMediaFile = async (file: File): Promise<{ url: string; filename: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
