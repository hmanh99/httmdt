from datetime import datetime, timezone
from decimal import Decimal
import random
import string
from typing import Any, Dict, List, Optional, Tuple
import uuid
from sqlalchemy import desc, func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.cart import Cart, CartItem
from app.models.catalog import Product, ProductImage, ProductVariant
from app.models.order import Coupon, Order, OrderItem, Payment
from app.models.user import User


def generate_order_number() -> str:
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"STR-{now_str}-{random_suffix}"


class OrderRepository:
    # ----------------------------------------------------
    # Cart Operations
    # ----------------------------------------------------
    @staticmethod
    async def get_or_create_user_cart(db: AsyncSession, user_id: uuid.UUID) -> Cart:
        stmt = (
            select(Cart)
            .where(Cart.user_id == user_id)
            .options(
                selectinload(Cart.items)
                .joinedload(CartItem.variant)
                .joinedload(ProductVariant.product)
                .selectinload(Product.images)
            )
        )
        result = await db.execute(stmt)
        cart = result.scalar_one_or_none()
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            await db.commit()
            return await OrderRepository.get_or_create_user_cart(db, user_id)
        return cart

    @staticmethod
    async def add_item_to_cart(
        db: AsyncSession, cart: Cart, variant: ProductVariant, quantity: int = 1
    ) -> CartItem:
        # Check if variant already exists in cart
        existing_item = next((i for i in cart.items if i.variant_id == variant.id), None)
        if existing_item:
            existing_item.quantity += quantity
            existing_item.unit_price = variant.effective_price
            await db.commit()
            await db.refresh(existing_item)
            await db.refresh(cart, ["items"])
            return existing_item

        new_item = CartItem(
            cart_id=cart.id,
            variant_id=variant.id,
            quantity=quantity,
            unit_price=variant.effective_price,
        )
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        await db.refresh(cart, ["items"])
        return new_item

    @staticmethod
    async def update_cart_item_quantity(
        db: AsyncSession, cart: Cart, variant_id: uuid.UUID, quantity: int
    ) -> Optional[CartItem]:
        item = next((i for i in cart.items if i.variant_id == variant_id), None)
        if not item:
            return None
        if quantity <= 0:
            await db.delete(item)
            await db.commit()
            await db.refresh(cart, ["items"])
            return None

        item.quantity = quantity
        await db.commit()
        await db.refresh(item)
        await db.refresh(cart, ["items"])
        return item

    @staticmethod
    async def remove_cart_item(db: AsyncSession, cart: Cart, variant_id: uuid.UUID) -> bool:
        item = next((i for i in cart.items if i.variant_id == variant_id), None)
        if not item:
            return False
        await db.delete(item)
        await db.commit()
        await db.refresh(cart, ["items"])
        return True

    @staticmethod
    async def clear_cart(db: AsyncSession, cart: Cart) -> None:
        await db.execute(delete(CartItem).where(CartItem.cart_id == cart.id))
        await db.commit()
        await db.refresh(cart, ["items"])

    # ----------------------------------------------------
    # Concurrency-Safe Stock & Order Placement
    # ----------------------------------------------------
    @staticmethod
    async def lock_variants_for_update(
        db: AsyncSession, variant_ids: List[uuid.UUID]
    ) -> Dict[uuid.UUID, ProductVariant]:
        """Locks variant rows for update within the active transaction."""
        stmt = (
            select(ProductVariant)
            .where(ProductVariant.id.in_(variant_ids))
            .options(
                joinedload(ProductVariant.product).selectinload(Product.images)
            )
            .with_for_update()
        )
        result = await db.execute(stmt)
        variants = list(result.scalars().all())
        return {v.id: v for v in variants}

    @staticmethod
    async def get_order_by_id(db: AsyncSession, order_id: uuid.UUID) -> Optional[Order]:
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                joinedload(Order.user),
                joinedload(Order.payment),
                selectinload(Order.items),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_order_by_number(db: AsyncSession, order_number: str) -> Optional[Order]:
        stmt = (
            select(Order)
            .where(Order.order_number == order_number)
            .options(
                joinedload(Order.user),
                joinedload(Order.payment),
                selectinload(Order.items),
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_orders(
        db: AsyncSession, user_id: uuid.UUID, page: int = 1, size: int = 10
    ) -> Tuple[List[Order], int]:
        count_stmt = select(func.count(Order.id)).where(Order.user_id == user_id)
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = (
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(desc(Order.created_at))
            .options(
                joinedload(Order.payment),
                selectinload(Order.items),
            )
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await db.execute(stmt)
        orders = list(result.scalars().all())
        return orders, total

    @staticmethod
    async def get_all_orders_admin(
        db: AsyncSession,
        status_filter: Optional[str] = None,
        page: int = 1,
        size: int = 15,
    ) -> Tuple[List[Order], int]:
        count_stmt = select(func.count(Order.id))
        if status_filter:
            count_stmt = count_stmt.where(Order.status == status_filter)
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = select(Order)
        if status_filter:
            stmt = stmt.where(Order.status == status_filter)
        stmt = (
            stmt.order_by(desc(Order.created_at))
            .options(
                joinedload(Order.user),
                joinedload(Order.payment),
                selectinload(Order.items),
            )
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await db.execute(stmt)
        orders = list(result.scalars().all())
        return orders, total

    @staticmethod
    async def update_order_status(
        db: AsyncSession, order: Order, new_status: str, admin_notes: Optional[str] = None
    ) -> Order:
        old_status = order.status
        order.status = new_status
        if admin_notes is not None:
            order.admin_notes = admin_notes

        # If order is cancelled and previously wasn't cancelled, restore variant inventory
        if new_status == "cancelled" and old_status != "cancelled":
            for item in order.items:
                if item.variant_id:
                    await db.execute(
                        update(ProductVariant)
                        .where(ProductVariant.id == item.variant_id)
                        .values(stock_quantity=ProductVariant.stock_quantity + item.quantity)
                    )

        # Update payment status if marked delivered / paid
        if new_status in ("paid", "delivered") and order.payment and order.payment.payment_status == "pending":
            order.payment.payment_status = "succeeded"

        await db.commit()
        await db.refresh(order)
        return order
