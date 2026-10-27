from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.catalog_repo import CatalogRepository
from app.schemas.catalog import BrandRead

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.get("", response_model=List[BrandRead])
async def list_brands(
    db: AsyncSession = Depends(get_db),
):
    """Retrieves all active shoe brands."""
    return await CatalogRepository.get_all_brands(db, only_active=True)


@router.get("/{identifier}", response_model=BrandRead)
async def get_brand(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves brand details by slug or UUID."""
    try:
        brand_id = uuid.UUID(identifier)
        brand = await CatalogRepository.get_brand_by_id(db, brand_id)
    except ValueError:
        brand = await CatalogRepository.get_brand_by_slug(db, identifier)

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found.",
        )
    return brand
