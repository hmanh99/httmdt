import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.catalog import ProductVariant
from app.models.user import User
from app.repositories.order_repo import OrderRepository
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartRead, CartSyncRequest
from app.schemas.common import MessageResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("", response_model=CartRead)
async def get_cart(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves the authenticated user's current shopping cart."""
    cart = await OrderRepository.get_or_create_user_cart(db, current_user.id)
    return OrderService.format_cart_read(cart)


@router.post("/items", response_model=CartRead, status_code=status.HTTP_201_CREATED)
async def add_item_to_cart(
    item_in: CartItemAdd,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Adds a shoe variant to the user's shopping cart with inventory verification."""
    # Check variant exists
    variant_res = await db.execute(
        select(ProductVariant)
        .where(ProductVariant.id == item_in.variant_id)
        .options(joinedload(ProductVariant.product))
    )
    variant = variant_res.scalar_one_or_none()
    if not variant or not variant.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product variant not found or is currently unavailable.",
        )

    if variant.stock_quantity < item_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity ({item_in.quantity}) exceeds available inventory ({variant.stock_quantity}).",
        )

    cart = await OrderRepository.get_or_create_user_cart(db, current_user.id)
    await OrderRepository.add_item_to_cart(db, cart, variant, item_in.quantity)
    refreshed_cart = await OrderRepository.get_or_create_user_cart(db, current_user.id)
    return OrderService.format_cart_read(refreshed_cart)


@router.put("/items/{variant_id}", response_model=CartRead)
async def update_cart_item(
    variant_id: uuid.UUID,
    item_in: CartItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates the quantity of a specific variant in the user's shopping cart."""
    cart = await OrderRepository.get_or_create_user_cart(db, current_user.id)

    if item_in.quantity > 0:
        variant_res = await db.execute(
            select(ProductVariant).where(ProductVariant.id == variant_id)
        )
        variant = variant_res.scalar_one_or_none()
        if variant and variant.stock_quantity < item_in.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quantity exceeds available inventory ({variant.stock_quantity}).",
            )

    await OrderRepository.update_cart_item_quantity(db, cart, variant_id, item_in.quantity)
    refreshed_cart = await OrderRepository.get_or_create_user_cart(db, current_user.id)
    return OrderService.format_cart_read(refreshed_cart)


@router.delete("/items/{variant_id}", response_model=CartRead)
async def remove_cart_item(
    variant_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Removes a specific item from the user's shopping cart."""
    cart = await OrderRepository.get_or_create_user_cart(db, current_user.id)
    await OrderRepository.remove_cart_item(db, cart, variant_id)
    refreshed_cart = await OrderRepository.get_or_create_user_cart(db, current_user.id)
    return OrderService.format_cart_read(refreshed_cart)


@router.delete("", response_model=MessageResponse)
async def clear_cart(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Clears all items from the current user's shopping cart."""
    cart = await OrderRepository.get_or_create_user_cart(db, current_user.id)
    await OrderRepository.clear_cart(db, cart)
    return MessageResponse(message="Cart cleared successfully.")


@router.post("/sync", response_model=CartRead)
async def sync_guest_cart(
    sync_in: CartSyncRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Merges offline or guest cart items into the authenticated user's cart on sign in."""
    cart = await OrderRepository.get_or_create_user_cart(db, current_user.id)
    for item in sync_in.items:
        variant_res = await db.execute(
            select(ProductVariant).where(ProductVariant.id == item.variant_id)
        )
        variant = variant_res.scalar_one_or_none()
        if variant and variant.is_active and variant.stock_quantity > 0:
            qty = min(item.quantity, variant.stock_quantity)
            await OrderRepository.add_item_to_cart(db, cart, variant, qty)

    refreshed = await OrderRepository.get_or_create_user_cart(db, current_user.id)
    return OrderService.format_cart_read(refreshed)
