export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin?: boolean;
  role: Role;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  street_line1: string;
  street_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  children?: Category[];
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color_name: string;
  color_hex: string;
  price_override?: number;
  effective_price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
  created_at?: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  short_description?: string;
  gender: string;
  base_price: number;
  is_featured: boolean;
  is_active: boolean;
  brand: Brand;
  category: Category;
  primary_image?: string;
  available_sizes: string[];
  available_colors: string[];
  total_stock: number;
  rating_average: number;
  review_count: number;
  created_at: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  gender: string;
  base_price: number;
  is_featured: boolean;
  is_active: boolean;
  brand: Brand;
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  primary_image?: string;
  total_stock: number;
  rating_average: number;
  review_count: number;
  created_at: string;
}

export interface FacetItem {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface CatalogFacets {
  brands: FacetItem[];
  categories: FacetItem[];
  sizes: string[];
  colors: string[];
  genders: string[];
  min_price: number;
  max_price: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  max_uses?: number;
  times_used: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}
