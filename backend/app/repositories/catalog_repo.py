import re
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
import uuid
from sqlalchemy import and_, distinct, func, or_, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.catalog import Brand, Category, Product, ProductImage, ProductVariant
from app.models.order import Coupon
from app.models.review import Review
from app.schemas.catalog import (
    BrandCreate,
    BrandUpdate,
    CategoryCreate,
    CategoryUpdate,
    CouponCreate,
    CouponUpdate,
    ProductCreate,
    ProductDetail,
    ProductListItem,
    ProductUpdate,
)


def slugify(text: str) -> str:
    """Generates a URL-friendly slug from text."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return re.sub(r"^-+|-+$", "", text)


class CatalogRepository:
    # ----------------------------------------------------
    # Brands
    # ----------------------------------------------------
    @staticmethod
    async def get_all_brands(db: AsyncSession, only_active: bool = True) -> List[Brand]:
        stmt = select(Brand)
        if only_active:
            stmt = stmt.where(Brand.is_active == True)  # noqa: E712
        stmt = stmt.order_by(Brand.name.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_brand_by_id(db: AsyncSession, brand_id: uuid.UUID) -> Optional[Brand]:
        stmt = select(Brand).where(Brand.id == brand_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_brand_by_slug(db: AsyncSession, slug: str) -> Optional[Brand]:
        stmt = select(Brand).where(Brand.slug == slug)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_brand(db: AsyncSession, brand_in: BrandCreate) -> Brand:
        slug = brand_in.slug or slugify(brand_in.name)
        brand = Brand(
            name=brand_in.name,
            slug=slug,
            description=brand_in.description,
            logo_url=brand_in.logo_url,
            website=brand_in.website,
            is_active=brand_in.is_active,
        )
        db.add(brand)
        await db.commit()
        await db.refresh(brand)
        return brand

    @staticmethod
    async def update_brand(db: AsyncSession, brand: Brand, brand_in: BrandUpdate) -> Brand:
        update_data = brand_in.model_dump(exclude_unset=True)
        if "name" in update_data and "slug" not in update_data and not brand_in.slug:
            update_data["slug"] = slugify(update_data["name"])

        for field, value in update_data.items():
            setattr(brand, field, value)

        await db.commit()
        await db.refresh(brand)
        return brand

    @staticmethod
    async def delete_brand(db: AsyncSession, brand: Brand) -> None:
        await db.delete(brand)
        await db.commit()

    # ----------------------------------------------------
    # Categories
    # ----------------------------------------------------
    @staticmethod
    async def get_all_categories(db: AsyncSession, only_active: bool = True) -> List[Category]:
        stmt = select(Category)
        if only_active:
            stmt = stmt.where(Category.is_active == True)  # noqa: E712
        stmt = stmt.order_by(Category.display_order.asc(), Category.name.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_category_by_id(db: AsyncSession, cat_id: uuid.UUID) -> Optional[Category]:
        stmt = select(Category).where(Category.id == cat_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_category_by_slug(db: AsyncSession, slug: str) -> Optional[Category]:
        stmt = select(Category).where(Category.slug == slug)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_category(db: AsyncSession, cat_in: CategoryCreate) -> Category:
        slug = cat_in.slug or slugify(cat_in.name)
        category = Category(
            name=cat_in.name,
            slug=slug,
            parent_id=cat_in.parent_id,
            description=cat_in.description,
            image_url=cat_in.image_url,
            display_order=cat_in.display_order,
            is_active=cat_in.is_active,
        )
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def update_category(db: AsyncSession, category: Category, cat_in: CategoryUpdate) -> Category:
        update_data = cat_in.model_dump(exclude_unset=True)
        if "name" in update_data and "slug" not in update_data and not cat_in.slug:
            update_data["slug"] = slugify(update_data["name"])

        for field, value in update_data.items():
            setattr(category, field, value)

        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def delete_category(db: AsyncSession, category: Category) -> None:
        await db.delete(category)
        await db.commit()

    # ----------------------------------------------------
    # Products (Admin CRUD)
    # ----------------------------------------------------
    @staticmethod
    async def create_product(db: AsyncSession, product_in: ProductCreate) -> Product:
        slug = product_in.slug or slugify(product_in.name)

        # Check unique slug collision and append suffix if needed
        existing = await CatalogRepository.get_product_by_slug(db, slug)
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        product = Product(
            name=product_in.name,
            slug=slug,
            brand_id=product_in.brand_id,
            category_id=product_in.category_id,
            description=product_in.description,
            short_description=product_in.short_description,
            gender=product_in.gender,
            base_price=product_in.base_price,
            is_featured=product_in.is_featured,
            is_active=product_in.is_active,
        )
        db.add(product)
        await db.flush()

        # Add variants
        for v in product_in.variants:
            variant = ProductVariant(
                product_id=product.id,
                sku=v.sku,
                size=v.size,
                color_name=v.color_name,
                color_hex=v.color_hex,
                price_override=v.price_override,
                stock_quantity=v.stock_quantity,
                is_active=v.is_active,
            )
            db.add(variant)

        # Add images
        if product_in.images:
            for idx, img in enumerate(product_in.images):
                image = ProductImage(
                    product_id=product.id,
                    image_url=img.image_url,
                    alt_text=img.alt_text or product.name,
                    is_primary=img.is_primary or (idx == 0),
                    display_order=img.display_order or idx,
                )
                db.add(image)

        await db.commit()
        return await CatalogRepository.get_product_by_id(db, product.id)  # type: ignore

    @staticmethod
    async def get_product_by_id(
        db: AsyncSession, product_id: uuid.UUID, include_deleted: bool = False
    ) -> Optional[Product]:
        stmt = (
            select(Product)
            .where(Product.id == product_id)
            .options(
                joinedload(Product.brand),
                joinedload(Product.category),
                selectinload(Product.variants),
                selectinload(Product.images),
                selectinload(Product.reviews),
            )
        )
        if not include_deleted:
            stmt = stmt.where(Product.is_deleted == False)  # noqa: E712
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_product_by_slug(
        db: AsyncSession, slug: str, include_deleted: bool = False
    ) -> Optional[Product]:
        stmt = (
            select(Product)
            .where(Product.slug == slug)
            .options(
                joinedload(Product.brand),
                joinedload(Product.category),
                selectinload(Product.variants),
                selectinload(Product.images),
                selectinload(Product.reviews),
            )
        )
        if not include_deleted:
            stmt = stmt.where(Product.is_deleted == False)  # noqa: E712
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_product(
        db: AsyncSession, product: Product, product_in: ProductUpdate
    ) -> Product:
        update_data = product_in.model_dump(exclude_unset=True)

        variants_data = update_data.pop("variants", None)
        images_data = update_data.pop("images", None)

        if "name" in update_data and "slug" not in update_data and not product_in.slug:
            update_data["slug"] = slugify(update_data["name"])

        for field, value in update_data.items():
            setattr(product, field, value)

        if variants_data is not None:
            # Replace variants
            await db.execute(
                delete(ProductVariant).where(ProductVariant.product_id == product.id)
            )
            for v in variants_data:
                db.add(ProductVariant(product_id=product.id, **v))

        if images_data is not None:
            # Replace images
            await db.execute(
                delete(ProductImage).where(ProductImage.product_id == product.id)
            )
            for idx, img in enumerate(images_data):
                db.add(
                    ProductImage(
                        product_id=product.id,
                        image_url=img["image_url"],
                        alt_text=img.get("alt_text", product.name),
                        is_primary=img.get("is_primary", idx == 0),
                        display_order=img.get("display_order", idx),
                    )
                )

        await db.commit()
        return await CatalogRepository.get_product_by_id(db, product.id)  # type: ignore

    @staticmethod
    async def soft_delete_product(db: AsyncSession, product: Product) -> None:
        product.soft_delete()
        await db.commit()

    # ----------------------------------------------------
    # Storefront Search & Faceted Filtering
    # ----------------------------------------------------
    @staticmethod
    async def search_products(
        db: AsyncSession,
        search: Optional[str] = None,
        brand_slugs: Optional[List[str]] = None,
        category_slugs: Optional[List[str]] = None,
        genders: Optional[List[str]] = None,
        sizes: Optional[List[str]] = None,
        colors: Optional[List[str]] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        in_stock_only: bool = False,
        is_featured: Optional[bool] = None,
        sort: str = "featured",  # featured, price_asc, price_desc, newest, rating
        page: int = 1,
        size: int = 12,
    ) -> Tuple[List[Product], int]:
        # Base query
        stmt = (
            select(Product)
            .distinct()
            .join(Product.brand)
            .join(Product.category)
            .outerjoin(Product.variants)
            .where(Product.is_deleted == False, Product.is_active == True)  # noqa: E712
            .options(
                joinedload(Product.brand),
                joinedload(Product.category),
                selectinload(Product.variants),
                selectinload(Product.images),
                selectinload(Product.reviews),
            )
        )

        conditions = []

        # Text search
        if search:
            search_term = f"%{search.strip()}%"
            conditions.append(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Brand.name.ilike(search_term),
                    Category.name.ilike(search_term),
                )
            )

        # Brand filter
        if brand_slugs:
            conditions.append(Brand.slug.in_(brand_slugs))

        # Category filter
        if category_slugs:
            conditions.append(Category.slug.in_(category_slugs))

        # Gender filter
        if genders:
            conditions.append(Product.gender.in_(genders))

        # Size filter
        if sizes:
            conditions.append(
                ProductVariant.size.in_(sizes)
            )

        # Color filter
        if colors:
            conditions.append(
                ProductVariant.color_name.in_(colors)
            )

        # Stock filter
        if in_stock_only:
            conditions.append(
                and_(ProductVariant.is_active == True, ProductVariant.stock_quantity > 0)  # noqa: E712
            )

        # Price range
        if min_price is not None:
            conditions.append(Product.base_price >= Decimal(str(min_price)))
        if max_price is not None:
            conditions.append(Product.base_price <= Decimal(str(max_price)))

        # Featured filter
        if is_featured is not None:
            conditions.append(Product.is_featured == is_featured)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Count total items matching
        count_stmt = select(func.count(distinct(Product.id)))
        count_stmt = count_stmt.join(Product.brand).join(Product.category).outerjoin(Product.variants)
        count_stmt = count_stmt.where(Product.is_deleted == False, Product.is_active == True)  # noqa: E712
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))

        total_res = await db.execute(count_stmt)
        total_count = total_res.scalar() or 0

        # Sorting
        if sort == "price_asc":
            stmt = stmt.order_by(Product.base_price.asc())
        elif sort == "price_desc":
            stmt = stmt.order_by(Product.base_price.desc())
        elif sort == "newest":
            stmt = stmt.order_by(Product.created_at.desc())
        elif sort == "featured":
            stmt = stmt.order_by(Product.is_featured.desc(), Product.created_at.desc())
        else:
            stmt = stmt.order_by(Product.created_at.desc())

        # Pagination
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        result = await db.execute(stmt)
        products = list(result.scalars().all())

        return products, total_count

    @staticmethod
    async def get_facets(db: AsyncSession) -> Dict[str, Any]:
        """Calculates available filter options with active counts."""
        # Brands facet
        brands_res = await db.execute(
            select(Brand.id, Brand.name, Brand.slug, func.count(distinct(Product.id)))
            .join(Product, Product.brand_id == Brand.id)
            .where(Product.is_deleted == False, Product.is_active == True, Brand.is_active == True)  # noqa: E712
            .group_by(Brand.id, Brand.name, Brand.slug)
            .order_by(Brand.name.asc())
        )
        brands = [
            {"id": row[0], "name": row[1], "slug": row[2], "count": row[3]}
            for row in brands_res.all()
        ]

        # Categories facet
        categories_res = await db.execute(
            select(Category.id, Category.name, Category.slug, func.count(distinct(Product.id)))
            .join(Product, Product.category_id == Category.id)
            .where(Product.is_deleted == False, Product.is_active == True, Category.is_active == True)  # noqa: E712
            .group_by(Category.id, Category.name, Category.slug)
            .order_by(Category.name.asc())
        )
        categories = [
            {"id": row[0], "name": row[1], "slug": row[2], "count": row[3]}
            for row in categories_res.all()
        ]

        # Sizes facet (distinct active variant sizes)
        sizes_res = await db.execute(
            select(ProductVariant.size)
            .distinct()
            .join(Product, Product.id == ProductVariant.product_id)
            .where(Product.is_deleted == False, Product.is_active == True, ProductVariant.is_active == True)  # noqa: E712
            .order_by(ProductVariant.size.asc())
        )
        sizes = [r[0] for r in sizes_res.all() if r[0]]

        # Colors facet
        colors_res = await db.execute(
            select(ProductVariant.color_name)
            .distinct()
            .join(Product, Product.id == ProductVariant.product_id)
            .where(Product.is_deleted == False, Product.is_active == True, ProductVariant.is_active == True)  # noqa: E712
            .order_by(ProductVariant.color_name.asc())
        )
        colors = [r[0] for r in colors_res.all() if r[0]]

        # Genders
        genders_res = await db.execute(
            select(Product.gender)
            .distinct()
            .where(Product.is_deleted == False, Product.is_active == True)  # noqa: E712
        )
        genders = [r[0] for r in genders_res.all() if r[0]]

        # Price bounds
        price_res = await db.execute(
            select(
                func.min(Product.base_price),
                func.max(Product.base_price),
            ).where(Product.is_deleted == False, Product.is_active == True)  # noqa: E712
        )
        min_p, max_p = price_res.one()

        return {
            "brands": brands,
            "categories": categories,
            "sizes": sizes,
            "colors": colors,
            "genders": genders,
            "min_price": float(min_p or 0),
            "max_price": float(max_p or 500),
        }

    # ----------------------------------------------------
    # Coupons
    # ----------------------------------------------------
    @staticmethod
    async def get_all_coupons(db: AsyncSession) -> List[Coupon]:
        stmt = select(Coupon).order_by(Coupon.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_coupon_by_code(db: AsyncSession, code: str) -> Optional[Coupon]:
        stmt = select(Coupon).where(Coupon.code == code.upper().strip())
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_coupon(db: AsyncSession, coupon_in: CouponCreate) -> Coupon:
        coupon = Coupon(
            code=coupon_in.code.upper().strip(),
            discount_type=coupon_in.discount_type,
            discount_value=coupon_in.discount_value,
            min_order_amount=coupon_in.min_order_amount,
            max_discount_amount=coupon_in.max_discount_amount,
            max_uses=coupon_in.max_uses,
            expires_at=coupon_in.expires_at,
            is_active=coupon_in.is_active,
        )
        db.add(coupon)
        await db.commit()
        await db.refresh(coupon)
        return coupon

    @staticmethod
    async def update_coupon(db: AsyncSession, coupon: Coupon, coupon_in: CouponUpdate) -> Coupon:
        update_data = coupon_in.model_dump(exclude_unset=True)
        if "code" in update_data:
            update_data["code"] = update_data["code"].upper().strip()

        for field, value in update_data.items():
            setattr(coupon, field, value)

        await db.commit()
        await db.refresh(coupon)
        return coupon

    @staticmethod
    async def delete_coupon(db: AsyncSession, coupon: Coupon) -> None:
        await db.delete(coupon)
        await db.commit()
