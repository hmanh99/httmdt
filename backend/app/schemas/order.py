from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.catalog import CouponRead


class AddressSnapshot(BaseModel):
    recipient_name: str
    phone: str
    street_line1: str
    street_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "United States"


class OrderCreateItem(BaseModel):
    variant_id: uuid.UUID
    quantity: int = Field(1, ge=1)


class OrderCreate(BaseModel):
    shipping_address: AddressSnapshot
    billing_address: Optional[AddressSnapshot] = None
    shipping_method: str = Field("standard", description="standard or express")
    payment_method: str = Field("cod", description="cod or stripe")
    coupon_code: Optional[str] = None
    customer_notes: Optional[str] = None
    items: Optional[List[OrderCreateItem]] = None  # If not provided, items are pulled from active cart


class OrderItemRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    variant_id: Optional[uuid.UUID] = None
    product_name: str
    sku: str
    size: str
    color_name: str
    image_url: Optional[str] = None
    unit_price: Decimal
    quantity: int
    total_price: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    payment_method: str
    payment_status: str
    transaction_id: Optional[str] = None
    amount: Decimal
    currency: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: uuid.UUID
    order_number: str
    user_id: uuid.UUID
    status: str
    subtotal: Decimal
    discount_amount: Decimal
    shipping_fee: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    shipping_method: str
    shipping_address_snapshot: Dict[str, Any]
    billing_address_snapshot: Optional[Dict[str, Any]] = None
    customer_notes: Optional[str] = None
    items: List[OrderItemRead] = []
    payment: Optional[PaymentRead] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: Decimal = Field(..., ge=Decimal("0.00"))


class CouponValidateResponse(BaseModel):
    is_valid: bool
    discount_amount: Decimal
    message: str
    coupon: Optional[CouponRead] = None


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="pending, paid, processing, shipped, delivered, cancelled")
    admin_notes: Optional[str] = None
