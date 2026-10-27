from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.review_repo import ReviewRepository
from app.schemas.review import ReviewCreate, ReviewRead

router = APIRouter(tags=["Reviews & Ratings"])


@router.get("/products/{product_id}/reviews", response_model=List[ReviewRead])
async def list_product_reviews(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Returns approved client reviews for a specific shoe model."""
    product = await CatalogRepository.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return await ReviewRepository.get_product_reviews(db, product_id)


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_product_review(
    product_id: uuid.UUID,
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Submits a customer rating and review for a shoe model, auto-verifying purchase."""
    product = await CatalogRepository.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    is_verified = await ReviewRepository.check_verified_purchase(
        db, current_user.id, product_id
    )

    review = await ReviewRepository.create_review(
        db,
        user_id=current_user.id,
        product_id=product_id,
        review_in=review_in,
        is_verified=is_verified,
    )
    return review
