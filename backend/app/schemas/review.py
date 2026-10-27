import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: str = Field(..., min_length=2, max_length=200)
    comment: str = Field(..., min_length=5)


class ReviewUserBrief(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class ReviewProductBrief(BaseModel):
    id: uuid.UUID
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class ReviewRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    rating: int
    title: str
    comment: str
    status: str
    is_verified_purchase: bool
    created_at: datetime
    user: Optional[ReviewUserBrief] = None
    product: Optional[ReviewProductBrief] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewStatusUpdate(BaseModel):
    status: str = Field(..., description="approved, rejected, pending")


class AdminStats(BaseModel):
    total_revenue: float
    total_orders: int
    pending_orders: int
    total_products: int
    total_customers: int
    low_stock_count: int
