from decimal import Decimal
import pytest
from httpx import AsyncClient
from app.core.config import settings


@pytest.mark.asyncio
async def test_admin_create_brand_and_category(
    client: AsyncClient, admin_auth_headers: dict, customer_auth_headers: dict
):
    # 1. Non-admin should be forbidden
    non_admin_resp = await client.post(
        f"{settings.API_V1_STR}/admin/brands",
        headers=customer_auth_headers,
        json={"name": "Vans", "description": "Classic skate shoes"},
    )
    assert non_admin_resp.status_code == 403

    # 2. Admin creates brand
    brand_resp = await client.post(
        f"{settings.API_V1_STR}/admin/brands",
        headers=admin_auth_headers,
        json={"name": "Vans", "description": "Classic skate shoes"},
    )
    assert brand_resp.status_code == 201
    brand_data = brand_resp.json()
    assert brand_data["name"] == "Vans"
    assert brand_data["slug"] == "vans"

    # 3. Admin creates category
    cat_resp = await client.post(
        f"{settings.API_V1_STR}/admin/categories",
        headers=admin_auth_headers,
        json={"name": "Retro High", "description": "High-top retros"},
    )
    assert cat_resp.status_code == 201
    cat_data = cat_resp.json()
    assert cat_data["name"] == "Retro High"
    assert cat_data["slug"] == "retro-high"


@pytest.mark.asyncio
async def test_admin_product_crud_and_public_search(
    client: AsyncClient, admin_auth_headers: dict
):
    # Create brand & category
    b_resp = await client.post(
        f"{settings.API_V1_STR}/admin/brands",
        headers=admin_auth_headers,
        json={"name": "Puma", "description": "Forever faster"},
    )
    brand_id = b_resp.json()["id"]

    c_resp = await client.post(
        f"{settings.API_V1_STR}/admin/categories",
        headers=admin_auth_headers,
        json={"name": "Motorsport", "description": "Speedcat and racing styles"},
    )
    category_id = c_resp.json()["id"]

    # 1. Admin creates product with 2 variants and 1 image
    product_payload = {
        "name": "Puma Speedcat OG 'Sparco'",
        "brand_id": brand_id,
        "category_id": category_id,
        "description": "Authentic motorsport heritage sneaker in rich red suede.",
        "short_description": "Motorsport low-profile silhouette.",
        "gender": "unisex",
        "base_price": 100.00,
        "is_featured": True,
        "is_active": True,
        "variants": [
            {
                "sku": "PUM-SPD-085",
                "size": "US 8.5",
                "color_name": "Ribbon Red / White",
                "color_hex": "#d63031",
                "stock_quantity": 15,
                "is_active": True,
            },
            {
                "sku": "PUM-SPD-090",
                "size": "US 9",
                "color_name": "Ribbon Red / White",
                "color_hex": "#d63031",
                "stock_quantity": 10,
                "is_active": True,
            },
        ],
        "images": [
            {
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
                "alt_text": "Puma Speedcat OG view 1",
                "is_primary": True,
                "display_order": 0,
            }
        ],
    }
    prod_resp = await client.post(
        f"{settings.API_V1_STR}/admin/products",
        headers=admin_auth_headers,
        json=product_payload,
    )
    assert prod_resp.status_code == 201
    prod_data = prod_resp.json()
    prod_id = prod_data["id"]
    slug = prod_data["slug"]
    assert prod_data["name"] == "Puma Speedcat OG 'Sparco'"
    assert len(prod_data["variants"]) == 2
    assert prod_data["total_stock"] == 25

    # 2. Public product detail retrieval
    detail_resp = await client.get(f"{settings.API_V1_STR}/products/{slug}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == prod_id

    # 3. Public search and faceted filtering
    # Search by keyword
    search_resp = await client.get(f"{settings.API_V1_STR}/products?search=Speedcat")
    assert search_resp.status_code == 200
    search_items = search_resp.json()["items"]
    assert len(search_items) >= 1
    assert any(item["id"] == prod_id for item in search_items)

    # Filter by brand slug
    brand_filter_resp = await client.get(f"{settings.API_V1_STR}/products?brand=puma")
    assert brand_filter_resp.status_code == 200
    assert any(item["id"] == prod_id for item in brand_filter_resp.json()["items"])

    # Filter by size
    size_filter_resp = await client.get(f"{settings.API_V1_STR}/products?size=US 8.5")
    assert size_filter_resp.status_code == 200
    assert any(item["id"] == prod_id for item in size_filter_resp.json()["items"])

    # Filter by price range
    price_filter_resp = await client.get(f"{settings.API_V1_STR}/products?min_price=90&max_price=120")
    assert price_filter_resp.status_code == 200
    assert any(item["id"] == prod_id for item in price_filter_resp.json()["items"])

    # 4. Check facets
    facets_resp = await client.get(f"{settings.API_V1_STR}/products/facets")
    assert facets_resp.status_code == 200
    facets = facets_resp.json()
    assert any(b["slug"] == "puma" for b in facets["brands"])
    assert "US 8.5" in facets["sizes"]

    # 5. Admin updates product
    update_resp = await client.put(
        f"{settings.API_V1_STR}/admin/products/{prod_id}",
        headers=admin_auth_headers,
        json={"base_price": 110.00, "is_featured": False},
    )
    assert update_resp.status_code == 200
    assert float(update_resp.json()["base_price"]) == 110.00

    # 6. Admin soft deletes product
    del_resp = await client.delete(
        f"{settings.API_V1_STR}/admin/products/{prod_id}",
        headers=admin_auth_headers,
    )
    assert del_resp.status_code == 200

    # Verify no longer returned in public search
    after_del_resp = await client.get(f"{settings.API_V1_STR}/products?search=Speedcat")
    assert not any(item["id"] == prod_id for item in after_del_resp.json()["items"])


@pytest.mark.asyncio
async def test_admin_coupons_crud(
    client: AsyncClient, admin_auth_headers: dict, customer_auth_headers: dict
):
    # Non-admin rejected
    unauth_resp = await client.post(
        f"{settings.API_V1_STR}/admin/coupons",
        headers=customer_auth_headers,
        json={
            "code": "TEST50",
            "discount_type": "percentage",
            "discount_value": 50.0,
            "min_order_amount": 100.0,
        },
    )
    assert unauth_resp.status_code == 403

    # Admin creates coupon
    create_resp = await client.post(
        f"{settings.API_V1_STR}/admin/coupons",
        headers=admin_auth_headers,
        json={
            "code": "TEST50",
            "discount_type": "percentage",
            "discount_value": 50.0,
            "min_order_amount": 100.0,
        },
    )
    assert create_resp.status_code == 201
    coupon_data = create_resp.json()
    coupon_id = coupon_data["id"]
    assert coupon_data["code"] == "TEST50"

    # List coupons
    list_resp = await client.get(f"{settings.API_V1_STR}/admin/coupons", headers=admin_auth_headers)
    assert list_resp.status_code == 200
    assert any(c["id"] == coupon_id for c in list_resp.json())

    # Delete coupon
    del_resp = await client.delete(
        f"{settings.API_V1_STR}/admin/coupons/{coupon_id}",
        headers=admin_auth_headers,
    )
    assert del_resp.status_code == 200
