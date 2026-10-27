from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


# ----------------------------------------
# Brand Schemas
# ----------------------------------------
class BrandBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: Optional[str] = Field(None, max_length=120)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    is_active: bool = True


class BrandCreate(BrandBase):
    pass


class BrandUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, max_length=120)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    is_active: Optional[bool] = None


class BrandRead(BrandBase):
    id: uuid.UUID
    slug: str
    created_at: datetime
    product_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# Category Schemas
# ----------------------------------------
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: Optional[str] = Field(None, max_length=120)
    parent_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, max_length=120)
    parent_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryRead(CategoryBase):
    id: uuid.UUID
    slug: str
    created_at: datetime
    children: Optional[List["CategoryRead"]] = []
    product_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# Product Variant Schemas
# ----------------------------------------
class ProductVariantBase(BaseModel):
    sku: str = Field(..., min_length=2, max_length=100)
    size: str = Field(..., min_length=1, max_length=20)
    color_name: str = Field(..., min_length=1, max_length=50)
    color_hex: str = Field("#000000", max_length=20)
    price_override: Optional[Decimal] = None
    stock_quantity: int = Field(0, ge=0)
    is_active: bool = True


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=2, max_length=100)
    size: Optional[str] = Field(None, min_length=1, max_length=20)
    color_name: Optional[str] = Field(None, min_length=1, max_length=50)
    color_hex: Optional[str] = Field(None, max_length=20)
    price_override: Optional[Decimal] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ProductVariantRead(ProductVariantBase):
    id: uuid.UUID
    product_id: uuid.UUID
    effective_price: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# Product Image Schemas
# ----------------------------------------
class ProductImageBase(BaseModel):
    image_url: str = Field(..., min_length=1, max_length=500)
    alt_text: Optional[str] = Field(None, max_length=255)
    is_primary: bool = False
    display_order: int = 0


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageRead(ProductImageBase):
    id: uuid.UUID
    product_id: uuid.UUID
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# Product Schemas
# ----------------------------------------
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: Optional[str] = Field(None, max_length=250)
    brand_id: uuid.UUID
    category_id: uuid.UUID
    description: str = Field(..., min_length=1)
    short_description: Optional[str] = Field(None, max_length=500)
    gender: str = Field("unisex", description="men, women, unisex, kids")
    base_price: Decimal = Field(..., gt=Decimal("0.00"))
    is_featured: bool = False
    is_active: bool = True


class ProductCreate(ProductBase):
    variants: List[ProductVariantCreate] = Field(..., min_length=1)
    images: Optional[List[ProductImageCreate]] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, max_length=250)
    brand_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    gender: Optional[str] = None
    base_price: Optional[Decimal] = Field(None, gt=Decimal("0.00"))
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    variants: Optional[List[ProductVariantCreate]] = None
    images: Optional[List[ProductImageCreate]] = None


class ProductListItem(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    short_description: Optional[str] = None
    gender: str
    base_price: Decimal
    is_featured: bool
    is_active: bool
    brand: BrandRead
    category: CategoryRead
    primary_image: Optional[str] = None
    available_sizes: List[str] = []
    available_colors: List[str] = []
    total_stock: int = 0
    rating_average: Optional[float] = 0.0
    review_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductDetail(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str
    short_description: Optional[str] = None
    gender: str
    base_price: Decimal
    is_featured: bool
    is_active: bool
    brand: BrandRead
    category: CategoryRead
    variants: List[ProductVariantRead] = []
    images: List[ProductImageRead] = []
    primary_image: Optional[str] = None
    total_stock: int = 0
    rating_average: Optional[float] = 0.0
    review_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------
# Filter Facets Schema
# ----------------------------------------
class FacetBrand(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    count: int


class FacetCategory(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    count: int


class CatalogFacets(BaseModel):
    brands: List[FacetBrand]
    categories: List[FacetCategory]
    sizes: List[str]
    colors: List[str]
    genders: List[str]
    min_price: float
    max_price: float


# ----------------------------------------
# Coupon Schemas
# ----------------------------------------
class CouponBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    discount_type: str = Field("percentage", description="percentage or fixed")
    discount_value: Decimal = Field(..., gt=Decimal("0.00"))
    min_order_amount: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    max_discount_amount: Optional[Decimal] = None
    max_uses: Optional[int] = Field(None, ge=1)
    expires_at: Optional[datetime] = None
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = Field(None, gt=Decimal("0.00"))
    min_order_amount: Optional[Decimal] = None
    max_discount_amount: Optional[Decimal] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class CouponRead(CouponBase):
    id: uuid.UUID
    times_used: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
