import math
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.catalog_repo import CatalogRepository
from app.schemas.catalog import CatalogFacets, ProductDetail, ProductListItem
from app.schemas.common import PaginatedResponse
from app.services.catalog_service import CatalogService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=PaginatedResponse[ProductListItem])
async def list_products(
    search: Optional[str] = Query(None, description="Search keyword in name or description"),
    brand: Optional[List[str]] = Query(None, description="Filter by brand slug(s)"),
    category: Optional[List[str]] = Query(None, description="Filter by category slug(s)"),
    gender: Optional[List[str]] = Query(None, description="Filter by gender (men, women, unisex, kids)"),
    size: Optional[List[str]] = Query(None, description="Filter by size (e.g. US 9, US 10)"),
    color: Optional[List[str]] = Query(None, description="Filter by color name"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum base price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum base price"),
    in_stock: bool = Query(False, description="Filter only shoes currently in stock"),
    featured: Optional[bool] = Query(None, description="Filter only featured shoes"),
    sort: str = Query("featured", description="Sort option: featured, newest, price_asc, price_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a paginated list of catalog products matching multi-faceted filters and search."""
    products, total = await CatalogRepository.search_products(
        db=db,
        search=search,
        brand_slugs=brand,
        category_slugs=category,
        genders=gender,
        sizes=size,
        colors=color,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock,
        is_featured=featured,
        sort=sort,
        page=page,
        size=page_size,
    )

    items = [CatalogService.format_product_list_item(p) for p in products]
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=page_size,
        total_pages=total_pages,
    )


@router.get("/facets", response_model=CatalogFacets)
async def get_catalog_facets(
    db: AsyncSession = Depends(get_db),
):
    """Retrieves faceted metadata for dynamic storefront filter sidebars."""
    return await CatalogRepository.get_facets(db)


@router.get("/featured", response_model=List[ProductListItem])
async def get_featured_products(
    limit: int = Query(8, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves curated featured shoes for home page spotlight carousels."""
    products, _ = await CatalogRepository.search_products(
        db=db,
        is_featured=True,
        sort="featured",
        page=1,
        size=limit,
    )
    return [CatalogService.format_product_list_item(p) for p in products]


@router.get("/{identifier}", response_model=ProductDetail)
async def get_product_detail(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves complete details for a product by slug or UUID."""
    return await CatalogService.get_product_detail(db, identifier)


@router.get("/{product_id}/related", response_model=List[ProductListItem])
async def get_related_products(
    product_id: uuid.UUID,
    limit: int = Query(4, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves related shoes from the same category or brand."""
    prod = await CatalogRepository.get_product_by_id(db, product_id)
    if not prod:
        return []

    products, _ = await CatalogRepository.search_products(
        db=db,
        category_slugs=[prod.category.slug],
        page=1,
        size=limit + 1,
    )
    # Exclude current product
    related = [p for p in products if p.id != prod.id][:limit]
    return [CatalogService.format_product_list_item(p) for p in related]
