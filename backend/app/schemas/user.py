from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleRead(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    role: RoleRead
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


class AddressBase(BaseModel):
    recipient_name: str = Field(..., min_length=1, max_length=150)
    phone: str = Field(..., min_length=5, max_length=30)
    street_line1: str = Field(..., min_length=1, max_length=255)
    street_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=2, max_length=20)
    country: str = Field("United States", min_length=2, max_length=100)
    is_default_shipping: bool = False
    is_default_billing: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    recipient_name: Optional[str] = Field(None, min_length=1, max_length=150)
    phone: Optional[str] = Field(None, min_length=5, max_length=30)
    street_line1: Optional[str] = Field(None, min_length=1, max_length=255)
    street_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=2, max_length=20)
    country: Optional[str] = Field(None, min_length=2, max_length=100)
    is_default_shipping: Optional[bool] = None
    is_default_billing: Optional[bool] = None


class AddressRead(AddressBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
