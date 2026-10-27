import { apiClient } from './client';

export interface ReviewItem {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  is_verified_purchase: boolean;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface ReviewSubmitData {
  rating: number;
  title: string;
  comment: string;
}

export const fetchProductReviews = async (productId: string): Promise<ReviewItem[]> => {
  const { data } = await apiClient.get<ReviewItem[]>(`/products/${productId}/reviews`);
  return data;
};

export const submitReview = async (productId: string, payload: ReviewSubmitData): Promise<ReviewItem> => {
  const { data } = await apiClient.post<ReviewItem>(`/products/${productId}/reviews`, payload);
  return data;
};
