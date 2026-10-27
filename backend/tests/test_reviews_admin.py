import pytest
import pytest_asyncio
from httpx import AsyncClient
from app.core.config import settings


@pytest_asyncio.fixture(scope="function")
async def seeded_catalog(client: AsyncClient, admin_auth_headers: dict) -> dict:
    # 1. Create brand
    brand_res = await client.post(
        f"{settings.API_V1_STR}/admin/brands",
        json={"name": "Puma Sport", "slug": "puma-sport"},
        headers=admin_auth_headers,
    )
    brand = brand_res.json()

    # 2. Create category
    cat_res = await client.post(
        f"{settings.API_V1_STR}/admin/categories",
        json={"name": "Running", "slug": "running"},
        headers=admin_auth_headers,
    )
    category = cat_res.json()

    # 3. Create product
    prod_res = await client.post(
        f"{settings.API_V1_STR}/admin/products",
        json={
            "name": "Puma Velocity Nitro 3",
            "slug": "puma-velocity-nitro-3",
            "description": "High performance everyday runner.",
            "gender": "unisex",
            "base_price": 140.0,
            "brand_id": brand["id"],
            "category_id": category["id"],
            "variants": [
                {
                    "sku": "PUMA-NITRO-US9",
                    "size": "US 9",
                    "color_name": "Royal Blue",
                    "color_hex": "#0000FF",
                    "stock_quantity": 25,
                }
            ],
            "images": [
                {
                    "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
                    "alt_text": "Puma Velocity",
                    "is_primary": True,
                }
            ],
        },
        headers=admin_auth_headers,
    )
    product = prod_res.json()
    return {"brand": brand, "category": category, "product": product}


@pytest.mark.asyncio
async def test_review_submission_and_listing(
    client: AsyncClient,
    customer_auth_headers: dict,
    seeded_catalog: dict,
):
    product_id = seeded_catalog["product"]["id"]

    # 1. Submit review
    review_payload = {
        "rating": 5,
        "title": "Outstanding comfort and responsiveness",
        "comment": "Ran 10k in these shoes straight out of the box, zero blisters and great energy return.",
    }
    submit_res = await client.post(
        f"{settings.API_V1_STR}/products/{product_id}/reviews",
        json=review_payload,
        headers=customer_auth_headers,
    )
    assert submit_res.status_code == 201
    review = submit_res.json()
    assert review["rating"] == 5
    assert review["title"] == review_payload["title"]
    assert review["status"] == "approved"
    assert review["is_verified_purchase"] is False  # Has not placed order yet

    # 2. List public reviews for product
    list_res = await client.get(f"{settings.API_V1_STR}/products/{product_id}/reviews")
    assert list_res.status_code == 200
    reviews = list_res.json()
    assert len(reviews) == 1
    assert reviews[0]["id"] == review["id"]
    assert reviews[0]["user"]["first_name"] == "Jordan"


@pytest.mark.asyncio
async def test_admin_dashboard_stats_and_reviews_moderation(
    client: AsyncClient,
    admin_auth_headers: dict,
    customer_auth_headers: dict,
    seeded_catalog: dict,
):
    product_id = seeded_catalog["product"]["id"]

    # 1. Add review
    await client.post(
        f"{settings.API_V1_STR}/products/{product_id}/reviews",
        json={
            "rating": 1,
            "title": "Spam comment test",
            "comment": "This is inappropriate content that should be rejected or removed.",
        },
        headers=customer_auth_headers,
    )

    # 2. Get admin stats
    stats_res = await client.get(
        f"{settings.API_V1_STR}/admin/stats",
        headers=admin_auth_headers,
    )
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_revenue" in stats
    assert "total_orders" in stats
    assert "total_products" in stats
    assert stats["total_products"] >= 1

    # 3. List admin reviews
    rev_list_res = await client.get(
        f"{settings.API_V1_STR}/admin/reviews",
        headers=admin_auth_headers,
    )
    assert rev_list_res.status_code == 200
    rev_data = rev_list_res.json()
    assert rev_data["total"] >= 1
    review_id = rev_data["items"][0]["id"]

    # 4. Moderate review (reject)
    status_res = await client.put(
        f"{settings.API_V1_STR}/admin/reviews/{review_id}/status",
        json={"status": "rejected"},
        headers=admin_auth_headers,
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "rejected"

    # 5. Delete review
    del_res = await client.delete(
        f"{settings.API_V1_STR}/admin/reviews/{review_id}",
        headers=admin_auth_headers,
    )
    assert del_res.status_code == 200
