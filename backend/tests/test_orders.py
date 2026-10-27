import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from app.core.config import settings
from app.models.catalog import Brand, Category, Product, ProductVariant
from app.models.order import Coupon, Order


@pytest_asyncio.fixture(scope="function")
async def sample_product_variant(client: AsyncClient, admin_auth_headers: dict) -> dict:
    # 1. Create Brand
    b_resp = await client.post(
        f"{settings.API_V1_STR}/admin/brands",
        headers=admin_auth_headers,
        json={"name": "Hoka", "description": "Maximalist running shoes"},
    )
    brand_id = b_resp.json()["id"]

    # 2. Create Category
    c_resp = await client.post(
        f"{settings.API_V1_STR}/admin/categories",
        headers=admin_auth_headers,
        json={"name": "Road Race", "description": "Ultra distance road shoes"},
    )
    category_id = c_resp.json()["id"]

    # 3. Create Product with initial stock of exactly 2 units on variant
    p_resp = await client.post(
        f"{settings.API_V1_STR}/admin/products",
        headers=admin_auth_headers,
        json={
            "name": "Hoka Rocket X 2",
            "brand_id": brand_id,
            "category_id": category_id,
            "description": "Hyper-focused road racing shoe.",
            "gender": "unisex",
            "base_price": 250.00,
            "is_featured": True,
            "is_active": True,
            "variants": [
                {
                    "sku": "HOK-RCK-095",
                    "size": "US 9.5",
                    "color_name": "Ceramic / Evening Primrose",
                    "color_hex": "#fffa65",
                    "stock_quantity": 2,  # Exactly 2 in stock!
                    "is_active": True,
                }
            ],
            "images": [
                {
                    "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
                    "is_primary": True,
                }
            ],
        },
    )
    return p_resp.json()


@pytest.mark.asyncio
async def test_cart_operations(
    client: AsyncClient, customer_auth_headers: dict, sample_product_variant: dict
):
    variant_id = sample_product_variant["variants"][0]["id"]

    # 1. Add item to cart
    add_resp = await client.post(
        f"{settings.API_V1_STR}/cart/items",
        headers=customer_auth_headers,
        json={"variant_id": variant_id, "quantity": 1},
    )
    assert add_resp.status_code == 201
    cart = add_resp.json()
    assert cart["total_quantity"] == 1
    assert len(cart["items"]) == 1
    assert cart["items"][0]["variant_id"] == variant_id

    # 2. Exceeding available inventory should fail
    excess_resp = await client.post(
        f"{settings.API_V1_STR}/cart/items",
        headers=customer_auth_headers,
        json={"variant_id": variant_id, "quantity": 10},
    )
    assert excess_resp.status_code == 400
    assert "exceeds available inventory" in excess_resp.json()["detail"]

    # 3. Update quantity
    update_resp = await client.put(
        f"{settings.API_V1_STR}/cart/items/{variant_id}",
        headers=customer_auth_headers,
        json={"quantity": 2},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["total_quantity"] == 2

    # 4. Remove item from cart
    del_resp = await client.delete(
        f"{settings.API_V1_STR}/cart/items/{variant_id}",
        headers=customer_auth_headers,
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["total_quantity"] == 0


@pytest.mark.asyncio
async def test_coupon_validation(client: AsyncClient, admin_auth_headers: dict):
    # Create coupon
    await client.post(
        f"{settings.API_V1_STR}/admin/coupons",
        headers=admin_auth_headers,
        json={
            "code": "SPRINT15",
            "discount_type": "percentage",
            "discount_value": 15.00,
            "min_order_amount": 100.00,
        },
    )

    # Valid coupon
    val_resp = await client.post(
        f"{settings.API_V1_STR}/orders/coupons/validate",
        json={"code": "SPRINT15", "subtotal": 200.00},
    )
    assert val_resp.status_code == 200
    assert val_resp.json()["is_valid"] is True
    assert float(val_resp.json()["discount_amount"]) == 30.00

    # Below minimum order threshold
    low_resp = await client.post(
        f"{settings.API_V1_STR}/orders/coupons/validate",
        json={"code": "SPRINT15", "subtotal": 50.00},
    )
    assert low_resp.status_code == 200
    assert low_resp.json()["is_valid"] is False

    # Non-existent coupon
    fake_resp = await client.post(
        f"{settings.API_V1_STR}/orders/coupons/validate",
        json={"code": "INVALID99", "subtotal": 200.00},
    )
    assert fake_resp.status_code == 200
    assert fake_resp.json()["is_valid"] is False


@pytest.mark.asyncio
async def test_order_creation_stock_edge_case_and_overselling(
    client: AsyncClient,
    customer_auth_headers: dict,
    sample_product_variant: dict,
):
    variant_id = sample_product_variant["variants"][0]["id"]
    # Available stock is initially 2

    # Attempt to order 3 units (more than 2 available) -> MUST RETURN 409 CONFLICT!
    failed_order_resp = await client.post(
        f"{settings.API_V1_STR}/orders",
        headers=customer_auth_headers,
        json={
            "shipping_address": {
                "recipient_name": "Marcus Aurelius",
                "phone": "+15551234567",
                "street_line1": "123 Victory Lane",
                "city": "Rome",
                "state": "NY",
                "postal_code": "13440",
            },
            "shipping_method": "standard",
            "payment_method": "cod",
            "items": [{"variant_id": variant_id, "quantity": 3}],
        },
    )
    assert failed_order_resp.status_code == 409
    assert "Insufficient inventory" in failed_order_resp.json()["detail"]

    # Verify inventory was NOT decremented and remains at 2!
    detail_resp = await client.get(
        f"{settings.API_V1_STR}/products/{sample_product_variant['slug']}"
    )
    assert detail_resp.status_code == 200
    assert detail_resp.json()["variants"][0]["stock_quantity"] == 2

    # Now, order 1 unit (valid within stock limit) -> MUST SUCCEED AND DECREMENT TO 1
    success_order_resp = await client.post(
        f"{settings.API_V1_STR}/orders",
        headers=customer_auth_headers,
        json={
            "shipping_address": {
                "recipient_name": "Marcus Aurelius",
                "phone": "+15551234567",
                "street_line1": "123 Victory Lane",
                "city": "Rome",
                "state": "NY",
                "postal_code": "13440",
            },
            "shipping_method": "standard",
            "payment_method": "cod",
            "items": [{"variant_id": variant_id, "quantity": 1}],
        },
    )
    assert success_order_resp.status_code == 201
    order_data = success_order_resp.json()
    assert order_data["status"] == "pending"
    assert order_data["order_number"].startswith("STR-")
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["quantity"] == 1

    # Verify inventory was decremented from 2 down to 1!
    detail_after = await client.get(
        f"{settings.API_V1_STR}/products/{sample_product_variant['slug']}"
    )
    assert detail_after.json()["variants"][0]["stock_quantity"] == 1

    # Order remaining 1 unit -> stock should become 0 (Sold Out)
    order_last_resp = await client.post(
        f"{settings.API_V1_STR}/orders",
        headers=customer_auth_headers,
        json={
            "shipping_address": {
                "recipient_name": "Marcus Aurelius",
                "phone": "+15551234567",
                "street_line1": "123 Victory Lane",
                "city": "Rome",
                "state": "NY",
                "postal_code": "13440",
            },
            "shipping_method": "standard",
            "payment_method": "cod",
            "items": [{"variant_id": variant_id, "quantity": 1}],
        },
    )
    assert order_last_resp.status_code == 201

    # Verify inventory is now 0!
    detail_zero = await client.get(
        f"{settings.API_V1_STR}/products/{sample_product_variant['slug']}"
    )
    assert detail_zero.json()["variants"][0]["stock_quantity"] == 0

    # Any further order must fail with 409 Conflict
    must_fail_resp = await client.post(
        f"{settings.API_V1_STR}/orders",
        headers=customer_auth_headers,
        json={
            "shipping_address": {
                "recipient_name": "Marcus Aurelius",
                "phone": "+15551234567",
                "street_line1": "123 Victory Lane",
                "city": "Rome",
                "state": "NY",
                "postal_code": "13440",
            },
            "shipping_method": "standard",
            "payment_method": "cod",
            "items": [{"variant_id": variant_id, "quantity": 1}],
        },
    )
    assert must_fail_resp.status_code == 409


@pytest.mark.asyncio
async def test_order_cancellation_restores_inventory(
    client: AsyncClient,
    admin_auth_headers: dict,
    customer_auth_headers: dict,
    sample_product_variant: dict,
):
    variant_id = sample_product_variant["variants"][0]["id"]
    # 1. Place order for 1 unit
    order_resp = await client.post(
        f"{settings.API_V1_STR}/orders",
        headers=customer_auth_headers,
        json={
            "shipping_address": {
                "recipient_name": "Tester",
                "phone": "+15551234567",
                "street_line1": "123 St",
                "city": "NY",
                "state": "NY",
                "postal_code": "10001",
            },
            "items": [{"variant_id": variant_id, "quantity": 1}],
        },
    )
    order_id = order_resp.json()["id"]

    # Stock was 2 -> now 1
    prod_resp = await client.get(
        f"{settings.API_V1_STR}/products/{sample_product_variant['slug']}"
    )
    assert prod_resp.json()["variants"][0]["stock_quantity"] == 1

    # 2. Admin cancels order
    cancel_resp = await client.put(
        f"{settings.API_V1_STR}/orders/{order_id}/status",
        headers=admin_auth_headers,
        json={"status": "cancelled", "admin_notes": "Customer requested cancellation"},
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"

    # 3. Inventory must be restored back to 2!
    prod_restored = await client.get(
        f"{settings.API_V1_STR}/products/{sample_product_variant['slug']}"
    )
    assert prod_restored.json()["variants"][0]["stock_quantity"] == 2
