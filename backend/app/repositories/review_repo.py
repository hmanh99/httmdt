from typing import List, Optional, Tuple
import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.catalog import Product
from app.models.order import Order, OrderItem
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate


class ReviewRepository:
    @staticmethod
    async def check_verified_purchase(
        db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID
    ) -> bool:
        """Checks if user has bought this product in a paid, shipped, or delivered order."""
        from app.models.catalog import ProductVariant

        stmt = (
            select(OrderItem.id)
            .join(Order, OrderItem.order_id == Order.id)
            .join(ProductVariant, OrderItem.variant_id == ProductVariant.id)
            .where(
                Order.user_id == user_id,
                ProductVariant.product_id == product_id,
                Order.status.in_(["paid", "shipped", "delivered"]),
            )
            .limit(1)
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none() is not None

    @staticmethod
    async def create_review(
        db: AsyncSession,
        user_id: uuid.UUID,
        product_id: uuid.UUID,
        review_in: ReviewCreate,
        is_verified: bool = False,
    ) -> Review:
        review = Review(
            user_id=user_id,
            product_id=product_id,
            rating=review_in.rating,
            title=review_in.title,
            comment=review_in.comment,
            status="approved",  # auto-approve by default for instant feedback
            is_verified_purchase=is_verified,
        )
        db.add(review)
        await db.commit()

        # Reload with user relationship
        stmt = (
            select(Review)
            .where(Review.id == review.id)
            .options(joinedload(Review.user), joinedload(Review.product))
        )
        res = await db.execute(stmt)
        return res.scalar_one()

    @staticmethod
    async def get_product_reviews(
        db: AsyncSession, product_id: uuid.UUID, status: str = "approved"
    ) -> List[Review]:
        stmt = (
            select(Review)
            .where(Review.product_id == product_id, Review.status == status)
            .options(joinedload(Review.user))
            .order_by(Review.created_at.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_admin_reviews(
        db: AsyncSession,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[Review], int]:
        stmt = select(Review).options(joinedload(Review.user), joinedload(Review.product))
        count_stmt = select(func.count(Review.id))

        if status and status != "all":
            stmt = stmt.where(Review.status == status)
            count_stmt = count_stmt.where(Review.status == status)

        count_res = await db.execute(count_stmt)
        total = count_res.scalar_one()

        stmt = stmt.order_by(Review.created_at.desc()).offset((page - 1) * size).limit(size)
        res = await db.execute(stmt)
        return list(res.scalars().all()), total

    @staticmethod
    async def get_review_by_id(db: AsyncSession, review_id: uuid.UUID) -> Optional[Review]:
        stmt = (
            select(Review)
            .where(Review.id == review_id)
            .options(joinedload(Review.user), joinedload(Review.product))
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def update_status(db: AsyncSession, review: Review, status: str) -> Review:
        review.status = status
        await db.commit()
        await db.refresh(review)
        return review

    @staticmethod
    async def delete_review(db: AsyncSession, review: Review) -> None:
        await db.delete(review)
        await db.commit()
