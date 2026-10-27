from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.catalog_repo import CatalogRepository
from app.schemas.catalog import CategoryRead

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryRead])
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    """Retrieves all active shoe categories."""
    categories = await CatalogRepository.get_all_categories(db, only_active=True)
    # Filter root categories to return nested tree
    return [c for c in categories if c.parent_id is None]


@router.get("/{identifier}", response_model=CategoryRead)
async def get_category(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves category details by slug or UUID."""
    try:
        cat_id = uuid.UUID(identifier)
        cat = await CatalogRepository.get_category_by_id(db, cat_id)
    except ValueError:
        cat = await CatalogRepository.get_category_by_slug(db, identifier)

    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found.",
        )
    return cat
