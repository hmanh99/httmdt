from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.catalog import Brand, Category, Product
from app.repositories.catalog_repo import CatalogRepository
from app.schemas.catalog import (
    BrandCreate,
    BrandRead,
    BrandUpdate,
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    ProductCreate,
    ProductDetail,
    ProductListItem,
    ProductUpdate,
)


class CatalogService:
    @staticmethod
    def format_product_list_item(p: Product) -> ProductListItem:
        # Find primary image or first available
        primary_img = None
        if p.images:
            for img in p.images:
                if img.is_primary:
                    primary_img = img.image_url
                    break
            if not primary_img and len(p.images) > 0:
                primary_img = p.images[0].image_url

        sizes = []
        colors = []
        total_stock = 0
        if p.variants:
            seen_sizes = set()
            seen_colors = set()
            for v in p.variants:
                if v.is_active:
                    total_stock += v.stock_quantity
                    if v.size not in seen_sizes:
                        seen_sizes.add(v.size)
                        sizes.append(v.size)
                    if v.color_name not in seen_colors:
                        seen_colors.add(v.color_name)
                        colors.append(v.color_name)

        rating_avg = 0.0
        review_count = 0
        if p.reviews:
            approved_reviews = [r for r in p.reviews if r.status == "approved"]
            review_count = len(approved_reviews)
            if review_count > 0:
                rating_avg = round(sum(r.rating for r in approved_reviews) / review_count, 1)

        return ProductListItem(
            id=p.id,
            name=p.name,
            slug=p.slug,
            short_description=p.short_description,
            gender=p.gender,
            base_price=p.base_price,
            is_featured=p.is_featured,
            is_active=p.is_active,
            brand=BrandRead.model_validate(p.brand),
            category=CategoryRead.model_validate(p.category),
            primary_image=primary_img,
            available_sizes=sizes,
            available_colors=colors,
            total_stock=total_stock,
            rating_average=rating_avg,
            review_count=review_count,
            created_at=p.created_at,
        )

    @staticmethod
    def format_product_detail(p: Product) -> ProductDetail:
        primary_img = None
        if p.images:
            for img in p.images:
                if img.is_primary:
                    primary_img = img.image_url
                    break
            if not primary_img and len(p.images) > 0:
                primary_img = p.images[0].image_url

        total_stock = sum(v.stock_quantity for v in p.variants if v.is_active) if p.variants else 0

        rating_avg = 0.0
        review_count = 0
        if p.reviews:
            approved_reviews = [r for r in p.reviews if r.status == "approved"]
            review_count = len(approved_reviews)
            if review_count > 0:
                rating_avg = round(sum(r.rating for r in approved_reviews) / review_count, 1)

        return ProductDetail(
            id=p.id,
            name=p.name,
            slug=p.slug,
            description=p.description,
            short_description=p.short_description,
            gender=p.gender,
            base_price=p.base_price,
            is_featured=p.is_featured,
            is_active=p.is_active,
            brand=BrandRead.model_validate(p.brand),
            category=CategoryRead.model_validate(p.category),
            variants=[v for v in p.variants if v.is_active],
            images=p.images,
            primary_image=primary_img,
            total_stock=total_stock,
            rating_average=rating_avg,
            review_count=review_count,
            created_at=p.created_at,
        )

    @classmethod
    async def get_product_detail(
        cls, db: AsyncSession, identifier: str
    ) -> ProductDetail:
        # Check if identifier is a valid UUID or slug
        try:
            prod_uuid = uuid.UUID(identifier)
            product = await CatalogRepository.get_product_by_id(db, prod_uuid)
        except ValueError:
            product = await CatalogRepository.get_product_by_slug(db, identifier)

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found.",
            )
        return cls.format_product_detail(product)
