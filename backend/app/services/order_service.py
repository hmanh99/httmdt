from decimal import Decimal
from typing import List, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import Cart
from app.models.catalog import ProductVariant
from app.models.order import Coupon, Order, OrderItem, Payment
from app.models.user import User
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.order_repo import OrderRepository, generate_order_number
from app.schemas.cart import CartItemRead, CartRead
from app.schemas.catalog import CouponRead
from app.schemas.order import CouponValidateResponse, OrderCreate, OrderCreateItem


class OrderService:
    @staticmethod
    def format_cart_read(cart: Cart) -> CartRead:
        formatted_items: List[CartItemRead] = []
        for item in cart.items:
            variant = item.variant
            if not variant:
                continue
            product = variant.product
            primary_img = None
            if product and product.images:
                for img in product.images:
                    if img.is_primary:
                        primary_img = img.image_url
                        break
                if not primary_img and len(product.images) > 0:
                    primary_img = product.images[0].image_url

            subtotal = item.unit_price * item.quantity
            formatted_items.append(
                CartItemRead(
                    id=item.id,
                    variant_id=item.variant_id,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    product_id=product.id if product else uuid.uuid4(),
                    product_name=product.name if product else "Unknown Sneaker",
                    product_slug=product.slug if product else "",
                    sku=variant.sku,
                    size=variant.size,
                    color_name=variant.color_name,
                    color_hex=variant.color_hex,
                    image_url=primary_img,
                    stock_quantity=variant.stock_quantity,
                    subtotal=subtotal,
                )
            )

        total_qty = sum(i.quantity for i in formatted_items)
        total_price = sum(i.subtotal for i in formatted_items)

        return CartRead(
            id=cart.id,
            user_id=cart.user_id,
            session_token=cart.session_token,
            items=formatted_items,
            total_quantity=total_qty,
            total_price=total_price,
        )

    @staticmethod
    async def validate_coupon(
        db: AsyncSession, code: str, subtotal: Decimal
    ) -> CouponValidateResponse:
        coupon = await CatalogRepository.get_coupon_by_code(db, code)
        if not coupon:
            return CouponValidateResponse(
                is_valid=False,
                discount_amount=Decimal("0.00"),
                message=f"Promo code '{code}' does not exist.",
            )

        if not coupon.is_active:
            return CouponValidateResponse(
                is_valid=False,
                discount_amount=Decimal("0.00"),
                message="This coupon is no longer active.",
            )

        if subtotal < coupon.min_order_amount:
            return CouponValidateResponse(
                is_valid=False,
                discount_amount=Decimal("0.00"),
                message=f"Order subtotal must be at least ${coupon.min_order_amount:.2f} to use this coupon.",
            )

        discount = coupon.calculate_discount(subtotal)
        return CouponValidateResponse(
            is_valid=True,
            discount_amount=discount,
            message=f"Coupon '{coupon.code}' applied successfully!",
            coupon=CouponRead.model_validate(coupon),
        )

    @classmethod
    async def create_order_transactional(
        cls, db: AsyncSession, user: User, order_in: OrderCreate
    ) -> Order:
        """
        Executes atomic order creation with pessimistic row-level locking.
        Prevents overselling under high concurrent traffic.
        """
        # Determine items
        checkout_items: List[OrderCreateItem] = []
        user_cart: Optional[Cart] = None

        if order_in.items and len(order_in.items) > 0:
            checkout_items = order_in.items
        else:
            # Pull from active cart
            user_cart = await OrderRepository.get_or_create_user_cart(db, user.id)
            if not user_cart.items:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot place order with an empty shopping cart.",
                )
            for ci in user_cart.items:
                checkout_items.append(
                    OrderCreateItem(variant_id=ci.variant_id, quantity=ci.quantity)
                )

        if not checkout_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No items specified for this order.",
            )

        # Step 1: Pessimistic Row-level Locking on all target variants
        variant_ids = [item.variant_id for item in checkout_items]
        variants_map = await OrderRepository.lock_variants_for_update(db, variant_ids)

        # Step 2: Validate stock availability on locked rows
        for item in checkout_items:
            variant = variants_map.get(item.variant_id)
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product variant ID {item.variant_id} not found.",
                )

            if not variant.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Variant {variant.sku} is currently inactive.",
                )

            if variant.stock_quantity < item.quantity:
                # Concurrency edge-case: abort immediately with 409 Conflict
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Insufficient inventory for {variant.product.name} ({variant.size}). "
                        f"Requested: {item.quantity}, Available: {variant.stock_quantity}."
                    ),
                )

        # Step 3: Compute subtotal and prepare order items
        subtotal = Decimal("0.00")
        prepared_order_items: List[OrderItem] = []

        for item in checkout_items:
            variant = variants_map[item.variant_id]
            unit_price = variant.effective_price
            item_total = unit_price * item.quantity
            subtotal += item_total

            # Primary image
            image_url = None
            if variant.product and variant.product.images:
                for img in variant.product.images:
                    if img.is_primary:
                        image_url = img.image_url
                        break
                if not image_url and len(variant.product.images) > 0:
                    image_url = variant.product.images[0].image_url

            prepared_order_items.append(
                OrderItem(
                    variant_id=variant.id,
                    product_name=variant.product.name,
                    sku=variant.sku,
                    size=variant.size,
                    color_name=variant.color_name,
                    image_url=image_url,
                    unit_price=unit_price,
                    quantity=item.quantity,
                    total_price=item_total,
                )
            )

        # Step 4: Validate Coupon if provided
        discount_amount = Decimal("0.00")
        applied_coupon: Optional[Coupon] = None
        if order_in.coupon_code:
            applied_coupon = await CatalogRepository.get_coupon_by_code(
                db, order_in.coupon_code
            )
            if applied_coupon and applied_coupon.is_valid(subtotal):
                discount_amount = applied_coupon.calculate_discount(subtotal)
                applied_coupon.times_used += 1

        # Step 5: Shipping Fee calculation
        if order_in.shipping_method == "express":
            shipping_fee = Decimal("25.00")
        else:
            # Free standard shipping over $100
            shipping_fee = Decimal("0.00") if subtotal >= Decimal("100.00") else Decimal("15.00")

        # Step 6: Estimated Tax (e.g. 8%)
        tax_amount = round((subtotal - discount_amount) * Decimal("0.08"), 2)
        total_amount = max(Decimal("0.00"), subtotal - discount_amount + shipping_fee + tax_amount)

        # Step 7: Decrement inventory on locked rows
        for item in checkout_items:
            variant = variants_map[item.variant_id]
            variant.stock_quantity -= item.quantity

        # Step 8: Create Order Record
        order_number = generate_order_number()
        order = Order(
            order_number=order_number,
            user_id=user.id,
            coupon_id=applied_coupon.id if applied_coupon else None,
            status="pending",
            subtotal=subtotal,
            discount_amount=discount_amount,
            shipping_fee=shipping_fee,
            tax_amount=tax_amount,
            total_amount=total_amount,
            shipping_method=order_in.shipping_method,
            shipping_address_snapshot=order_in.shipping_address.model_dump(),
            billing_address_snapshot=(
                order_in.billing_address.model_dump()
                if order_in.billing_address
                else order_in.shipping_address.model_dump()
            ),
            customer_notes=order_in.customer_notes,
        )
        db.add(order)
        await db.flush()

        # Link order items
        for oi in prepared_order_items:
            oi.order_id = order.id
            db.add(oi)

        # Step 9: Create Payment Record
        # Payment status: COD is pending upon delivery, Stripe is marked succeeded in demo/stub mode
        initial_pay_status = "succeeded" if order_in.payment_method == "stripe" else "pending"
        transaction_id = f"txn_{uuid.uuid4().hex[:12]}" if order_in.payment_method == "stripe" else None

        payment = Payment(
            order_id=order.id,
            payment_method=order_in.payment_method,
            payment_status=initial_pay_status,
            transaction_id=transaction_id,
            amount=total_amount,
            currency="USD",
        )
        db.add(payment)

        # Step 10: Clear items from cart if checked out from cart
        if user_cart:
            await OrderRepository.clear_cart(db, user_cart)

        # Step 11: Commit atomic transaction!
        await db.commit()

        # Refresh order for full serialization
        return await OrderRepository.get_order_by_id(db, order.id)  # type: ignore
