import { apiClient } from './client';
import { Address, PaginatedResponse } from '../types';

export interface AddressSnapshot {
  recipient_name: string;
  phone: string;
  street_line1: string;
  street_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItemSnapshot {
  variant_id: string;
  quantity: number;
}

export interface OrderCreatePayload {
  shipping_address: AddressSnapshot;
  billing_address?: AddressSnapshot;
  shipping_method: 'standard' | 'express';
  payment_method: 'cod' | 'stripe';
  coupon_code?: string;
  customer_notes?: string;
  items?: OrderItemSnapshot[];
}

export interface OrderItemDetail {
  id: string;
  variant_id?: string;
  product_name: string;
  sku: string;
  size: string;
  color_name: string;
  image_url?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  created_at: string;
}

export interface PaymentDetail {
  id: string;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  amount: number;
  currency: string;
  created_at: string;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  shipping_method: string;
  shipping_address_snapshot: AddressSnapshot;
  billing_address_snapshot?: AddressSnapshot;
  customer_notes?: string;
  items: OrderItemDetail[];
  payment?: PaymentDetail;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  is_valid: boolean;
  discount_amount: number;
  message: string;
  coupon?: any;
}

export const createOrder = async (payload: OrderCreatePayload): Promise<OrderDetail> => {
  const response = await apiClient.post<OrderDetail>('/orders', payload);
  return response.data;
};

export const fetchUserOrders = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<OrderDetail>> => {
  const response = await apiClient.get<PaginatedResponse<OrderDetail>>('/orders', {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

export const fetchOrderDetail = async (identifier: string): Promise<OrderDetail> => {
  const response = await apiClient.get<OrderDetail>(`/orders/${identifier}`);
  return response.data;
};

export const validateCouponCode = async (
  code: string,
  subtotal: number
): Promise<CouponValidationResult> => {
  const response = await apiClient.post<CouponValidationResult>('/orders/coupons/validate', {
    code,
    subtotal,
  });
  return response.data;
};

export const fetchSavedAddresses = async (): Promise<Address[]> => {
  const response = await apiClient.get<Address[]>('/users/addresses');
  return response.data;
};

export const createSavedAddress = async (payload: Partial<Address>): Promise<Address> => {
  const response = await apiClient.post<Address>('/users/addresses', payload);
  return response.data;
};
