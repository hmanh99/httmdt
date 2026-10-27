from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class CartItemAdd(BaseModel):
    variant_id: uuid.UUID
    quantity: int = Field(1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0)


class CartItemRead(BaseModel):
    id: uuid.UUID
    variant_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    product_id: uuid.UUID
    product_name: str
    product_slug: str
    sku: str
    size: str
    color_name: str
    color_hex: str
    image_url: Optional[str] = None
    stock_quantity: int
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class CartRead(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    session_token: Optional[str] = None
    items: List[CartItemRead] = []
    total_quantity: int = 0
    total_price: Decimal = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)


class CartSyncRequest(BaseModel):
    items: List[CartItemAdd]
