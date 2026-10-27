import math
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_admin
from app.models.user import User
from app.repositories.order_repo import OrderRepository
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.order import (
    CouponValidateRequest,
    CouponValidateResponse,
    OrderCreate,
    OrderRead,
    OrderStatusUpdate,
)
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders & Checkout"])


@router.post("/coupons/validate", response_model=CouponValidateResponse)
async def validate_promo_coupon(
    coupon_in: CouponValidateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Validates a promotional discount coupon code against a checkout subtotal."""
    return await OrderService.validate_coupon(db, coupon_in.code, coupon_in.subtotal)


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Places an order atomically with pessimistic row-level locking.
    Validates inventory and immediately decrements stock to prevent overselling.
    """
    order = await OrderService.create_order_transactional(db, current_user, order_in)
    return order


@router.get("", response_model=PaginatedResponse[OrderRead])
async def list_user_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves paginated order history for the authenticated customer."""
    orders, total = await OrderRepository.get_user_orders(
        db, current_user.id, page=page, size=page_size
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse(
        items=orders,
        total=total,
        page=page,
        size=page_size,
        total_pages=total_pages,
    )


@router.get("/{identifier}", response_model=OrderRead)
async def get_order_detail(
    identifier: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves order details and shipping tracking status by order number or UUID."""
    try:
        order_uuid = uuid.UUID(identifier)
        order = await OrderRepository.get_order_by_id(db, order_uuid)
    except ValueError:
        order = await OrderRepository.get_order_by_number(db, identifier)

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    # Authorization: Customers can only see their own orders, Admins can view all
    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this order.",
        )

    return order


@router.put("/{order_id}/status", response_model=OrderRead)
async def update_order_status(
    order_id: uuid.UUID,
    status_in: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Updates order status workflow (pending -> paid -> processing -> shipped -> delivered / cancelled)."""
    order = await OrderRepository.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    return await OrderRepository.update_order_status(
        db, order, status_in.status, status_in.admin_notes
    )
