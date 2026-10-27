import { apiClient } from './client';
import { AuthTokens, User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const apiLogin = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
};

export const apiRegister = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
};

export const apiGetMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};

export const apiUpdateMe = async (data: Partial<User>): Promise<User> => {
  const response = await apiClient.put<User>('/auth/me', data);
  return response.data;
};

export const apiChangePassword = async (payload: {
  current_password: string;
  new_password: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/change-password', payload);
  return response.data;
};

export interface AddressItem {
  id: string;
  recipient_name: string;
  phone: string;
  street_address: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

export const apiGetAddresses = async (): Promise<AddressItem[]> => {
  const response = await apiClient.get<AddressItem[]>('/users/addresses');
  return response.data;
};

export const apiCreateAddress = async (payload: Partial<AddressItem>): Promise<AddressItem> => {
  const response = await apiClient.post<AddressItem>('/users/addresses', payload);
  return response.data;
};

export const apiDeleteAddress = async (id: string): Promise<any> => {
  const response = await apiClient.delete(`/users/addresses/${id}`);
  return response.data;
};

