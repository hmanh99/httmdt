from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.repositories.catalog_repo import CatalogRepository
from app.schemas.catalog import (
    BrandCreate,
    BrandRead,
    BrandUpdate,
    CategoryCreate,
    CategoryRead,
    CategoryUpdate,
    CouponCreate,
    CouponRead,
    CouponUpdate,
    ProductCreate,
    ProductDetail,
    ProductListItem,
    ProductUpdate,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.catalog_service import CatalogService
from app.services.storage_service import storage_service

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


# ---------------------------------------------------------
# Media Upload
# ---------------------------------------------------------
@router.post("/upload", response_model=dict)
async def upload_image(
    file: UploadFile = File(...),
    subfolder: str = Query("products", description="Subfolder name for grouping uploads"),
    current_admin: User = Depends(require_admin),
):
    """Uploads an image file to local storage and returns its accessible public URL."""
    url = await storage_service.upload_file(file, subfolder=subfolder)
    return {"url": url, "filename": file.filename}


# ---------------------------------------------------------
# Product Management (Admin)
# ---------------------------------------------------------
@router.post("/products", response_model=ProductDetail, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Creates a new shoe product with variants (size, color, sku, stock, price) and images."""
    product = await CatalogRepository.create_product(db, product_in)
    return CatalogService.format_product_detail(product)


@router.put("/products/{product_id}", response_model=ProductDetail)
async def update_product(
    product_id: uuid.UUID,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Updates an existing shoe product and its nested variants/images."""
    product = await CatalogRepository.get_product_by_id(db, product_id, include_deleted=True)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    updated = await CatalogRepository.update_product(db, product, product_in)
    return CatalogService.format_product_detail(updated)


@router.delete("/products/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Soft deletes a product from the catalog."""
    product = await CatalogRepository.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    await CatalogRepository.soft_delete_product(db, product)
    return MessageResponse(message=f"Product '{product.name}' was soft deleted successfully.")


# ---------------------------------------------------------
# Brand Management (Admin)
# ---------------------------------------------------------
@router.post("/brands", response_model=BrandRead, status_code=status.HTTP_201_CREATED)
async def create_brand(
    brand_in: BrandCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Creates a new shoe brand."""
    brand = await CatalogRepository.create_brand(db, brand_in)
    return brand


@router.put("/brands/{brand_id}", response_model=BrandRead)
async def update_brand(
    brand_id: uuid.UUID,
    brand_in: BrandUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Updates an existing brand."""
    brand = await CatalogRepository.get_brand_by_id(db, brand_id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")
    return await CatalogRepository.update_brand(db, brand, brand_in)


@router.delete("/brands/{brand_id}", response_model=MessageResponse)
async def delete_brand(
    brand_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Deletes a brand."""
    brand = await CatalogRepository.get_brand_by_id(db, brand_id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")
    await CatalogRepository.delete_brand(db, brand)
    return MessageResponse(message="Brand deleted successfully.")


# ---------------------------------------------------------
# Category Management (Admin)
# ---------------------------------------------------------
@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Creates a new shoe category."""
    category = await CatalogRepository.create_category(db, cat_in)
    return category


@router.put("/categories/{cat_id}", response_model=CategoryRead)
async def update_category(
    cat_id: uuid.UUID,
    cat_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Updates an existing category."""
    category = await CatalogRepository.get_category_by_id(db, cat_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    return await CatalogRepository.update_category(db, category, cat_in)


@router.delete("/categories/{cat_id}", response_model=MessageResponse)
async def delete_category(
    cat_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Deletes a category."""
    category = await CatalogRepository.get_category_by_id(db, cat_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    await CatalogRepository.delete_category(db, category)
    return MessageResponse(message="Category deleted successfully.")


# ---------------------------------------------------------
# Coupon Management (Admin)
# ---------------------------------------------------------
@router.get("/coupons", response_model=List[CouponRead])
async def list_coupons(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Lists all coupons."""
    return await CatalogRepository.get_all_coupons(db)


@router.post("/coupons", response_model=CouponRead, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    coupon_in: CouponCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Creates a promotional discount coupon."""
    existing = await CatalogRepository.get_coupon_by_code(db, coupon_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon code '{coupon_in.code}' already exists.",
        )
    return await CatalogRepository.create_coupon(db, coupon_in)


@router.put("/coupons/{coupon_id}", response_model=CouponRead)
async def update_coupon(
    coupon_id: uuid.UUID,
    coupon_in: CouponUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Updates a coupon."""
    coupon = await CatalogRepository.get_coupon_by_code(db, coupon_id.hex)  # or by ID
    # Query by ID directly
    from sqlalchemy import select
    from app.models.order import Coupon
    res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = res.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found.")
    return await CatalogRepository.update_coupon(db, coupon, coupon_in)


@router.delete("/coupons/{coupon_id}", response_model=MessageResponse)
async def delete_coupon(
    coupon_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Deletes a coupon."""
    from sqlalchemy import select
    from app.models.order import Coupon
    res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = res.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found.")
    await CatalogRepository.delete_coupon(db, coupon)
    return MessageResponse(message="Coupon deleted successfully.")


# ---------------------------------------------------------
# Admin Dashboard Analytics & Overview
# ---------------------------------------------------------
@router.get("/stats")
async def get_admin_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Returns top-level KPIs for the Admin Dashboard."""
    from sqlalchemy import func, select
    from app.models.catalog import Product, ProductVariant
    from app.models.order import Order
    from app.models.user import User as UserModel

    rev_res = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status.in_(["paid", "processing", "shipped", "delivered"])
        )
    )
    total_rev = float(rev_res.scalar_one())

    orders_count_res = await db.execute(select(func.count(Order.id)))
    total_orders = orders_count_res.scalar_one()

    pending_count_res = await db.execute(
        select(func.count(Order.id)).where(Order.status.in_(["pending", "processing"]))
    )
    pending_orders = pending_count_res.scalar_one()

    prod_count_res = await db.execute(
        select(func.count(Product.id)).where(Product.is_deleted == False)  # noqa: E712
    )
    total_products = prod_count_res.scalar_one()

    user_count_res = await db.execute(select(func.count(UserModel.id)))
    total_customers = user_count_res.scalar_one()

    low_stock_res = await db.execute(
        select(func.count(ProductVariant.id)).where(ProductVariant.stock_quantity <= 5)
    )
    low_stock_count = low_stock_res.scalar_one()

    # Recent 5 orders
    recent_res = await db.execute(
        select(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    recent_orders = [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "status": o.status,
            "total_amount": float(o.total_amount),
            "created_at": o.created_at.isoformat(),
        }
        for o in recent_res.scalars().all()
    ]

    return {
        "total_revenue": total_rev,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_products": total_products,
        "total_customers": total_customers,
        "low_stock_count": low_stock_count,
        "recent_orders": recent_orders,
    }


# ---------------------------------------------------------
# Admin Order Management
# ---------------------------------------------------------
@router.get("/orders")
async def list_admin_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status (pending, paid, shipped, delivered, cancelled)"),
    search: Optional[str] = Query(None, description="Search by order number or customer email"),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieves paginated orders with filter and customer details for admin table."""
    import math
    from sqlalchemy import func, select, or_
    from sqlalchemy.orm import selectinload, joinedload
    from app.models.order import Order
    from app.models.user import User as UserModel

    stmt = select(Order).join(Order.user).options(selectinload(Order.items), joinedload(Order.user))
    count_stmt = select(func.count(Order.id)).join(Order.user)

    if status and status != "all":
        stmt = stmt.where(Order.status == status)
        count_stmt = count_stmt.where(Order.status == status)

    if search:
        search_filter = or_(
            Order.order_number.ilike(f"%{search}%"),
            UserModel.email.ilike(f"%{search}%"),
            UserModel.last_name.ilike(f"%{search}%"),
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    total_count = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    orders = result.scalars().all()

    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 0

    items_data = []
    for o in orders:
        items_data.append({
            "id": str(o.id),
            "order_number": o.order_number,
            "status": o.status,
            "total_amount": float(o.total_amount),
            "subtotal": float(o.subtotal),
            "shipping_fee": float(o.shipping_fee),
            "discount_amount": float(o.discount_amount),
            "item_count": sum(it.quantity for it in o.items),
            "customer_name": f"{o.user.first_name} {o.user.last_name}".strip() if o.user else "Guest",
            "customer_email": o.user.email if o.user else "N/A",
            "created_at": o.created_at.isoformat(),
            "tracking_number": o.tracking_number,
        })

    return {
        "items": items_data,
        "total": total_count,
        "page": page,
        "size": page_size,
        "total_pages": total_pages,
    }


# ---------------------------------------------------------
# Admin Review Moderation
# ---------------------------------------------------------
@router.get("/reviews")
async def list_admin_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="all, pending, approved, rejected"),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Retrieves customer reviews for moderation."""
    import math
    from app.repositories.review_repo import ReviewRepository

    reviews, total = await ReviewRepository.get_admin_reviews(
        db, status=status, page=page, size=page_size
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return {
        "items": [
            {
                "id": str(r.id),
                "product_id": str(r.product_id),
                "product_name": r.product.name if r.product else "N/A",
                "customer_name": f"{r.user.first_name} {r.user.last_name}".strip() if r.user else "Anonymous",
                "customer_email": r.user.email if r.user else "N/A",
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "status": r.status,
                "is_verified_purchase": r.is_verified_purchase,
                "created_at": r.created_at.isoformat(),
            }
            for r in reviews
        ],
        "total": total,
        "page": page,
        "size": page_size,
        "total_pages": total_pages,
    }


@router.put("/reviews/{review_id}/status")
async def update_review_status(
    review_id: uuid.UUID,
    status_in: dict,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Approves or rejects a customer review."""
    from app.repositories.review_repo import ReviewRepository
    review = await ReviewRepository.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")

    new_status = status_in.get("status", "approved")
    updated = await ReviewRepository.update_status(db, review, new_status)
    return {"message": f"Review marked as {new_status}", "id": str(updated.id), "status": updated.status}


@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """Permanently removes a spam or inappropriate review."""
    from app.repositories.review_repo import ReviewRepository
    review = await ReviewRepository.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")
    await ReviewRepository.delete_review(db, review)
    return MessageResponse(message="Review removed successfully.")

