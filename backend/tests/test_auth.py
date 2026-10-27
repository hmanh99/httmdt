import pytest
from httpx import AsyncClient
from app.core.config import settings


@pytest.mark.asyncio
async def test_healthcheck(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "STRIDE Footwear"


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    payload = {
        "email": "newuser@example.com",
        "password": "SecurePassword123!",
        "first_name": "Marcus",
        "last_name": "Aurelius",
        "phone": "+1999888777",
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "user" in data
    assert "tokens" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["first_name"] == "Marcus"
    assert data["user"]["role"]["name"] == "customer"
    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "User",
    }
    # First registration
    resp1 = await client.post(f"{settings.API_V1_STR}/auth/register", json=payload)
    assert resp1.status_code == 201

    # Second registration with duplicate email
    resp2 = await client.post(f"{settings.API_V1_STR}/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register first
    email = "login.test@example.com"
    password = "MyPassword123!"
    await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": email,
            "password": password,
            "first_name": "Login",
            "last_name": "User",
        },
    )

    # Login
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "tokens" in data
    assert "user" in data
    assert data["user"]["email"] == email


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": settings.FIRST_SUPERUSER_EMAIL, "password": "WrongPassword999"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    # Login as admin to get initial tokens
    login_resp = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email": settings.FIRST_SUPERUSER_EMAIL,
            "password": settings.FIRST_SUPERUSER_PASSWORD,
        },
    )
    tokens = login_resp.json()["tokens"]

    # Refresh
    refresh_resp = await client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_resp.status_code == 200
    new_tokens = refresh_resp.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens


@pytest.mark.asyncio
async def test_get_current_user_me(client: AsyncClient, customer_auth_headers: dict):
    response = await client.get(f"{settings.API_V1_STR}/auth/me", headers=customer_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "customer.test@example.com"
    assert data["role"]["name"] == "customer"


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    response = await client.get(f"{settings.API_V1_STR}/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, customer_auth_headers: dict):
    # Change password
    change_resp = await client.post(
        f"{settings.API_V1_STR}/auth/change-password",
        headers=customer_auth_headers,
        json={"current_password": "Password123!", "new_password": "NewSecurePassword456!"},
    )
    assert change_resp.status_code == 200

    # Old password should fail
    old_login = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "customer.test@example.com", "password": "Password123!"},
    )
    assert old_login.status_code == 401

    # New password should succeed
    new_login = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "customer.test@example.com", "password": "NewSecurePassword456!"},
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_user_addresses_crud(client: AsyncClient, customer_auth_headers: dict):
    # 1. Create Address
    create_payload = {
        "recipient_name": "Jordan Doe",
        "phone": "+15551234567",
        "street_line1": "742 Evergreen Terrace",
        "street_line2": "Apt 4B",
        "city": "Springfield",
        "state": "OR",
        "postal_code": "97477",
        "country": "United States",
        "is_default_shipping": True,
        "is_default_billing": True,
    }
    create_resp = await client.post(
        f"{settings.API_V1_STR}/users/addresses",
        headers=customer_auth_headers,
        json=create_payload,
    )
    assert create_resp.status_code == 201
    address_data = create_resp.json()
    address_id = address_data["id"]
    assert address_data["city"] == "Springfield"
    assert address_data["is_default_shipping"] is True

    # 2. List Addresses
    list_resp = await client.get(
        f"{settings.API_V1_STR}/users/addresses",
        headers=customer_auth_headers,
    )
    assert list_resp.status_code == 200
    addresses = list_resp.json()
    assert len(addresses) == 1
    assert addresses[0]["id"] == address_id

    # 3. Update Address
    update_resp = await client.put(
        f"{settings.API_V1_STR}/users/addresses/{address_id}",
        headers=customer_auth_headers,
        json={"city": "Eugene", "postal_code": "97401"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["city"] == "Eugene"
    assert update_resp.json()["postal_code"] == "97401"

    # 4. Delete Address
    delete_resp = await client.delete(
        f"{settings.API_V1_STR}/users/addresses/{address_id}",
        headers=customer_auth_headers,
    )
    assert delete_resp.status_code == 200

    # 5. List should now be empty
    list_after = await client.get(
        f"{settings.API_V1_STR}/users/addresses",
        headers=customer_auth_headers,
    )
    assert len(list_after.json()) == 0
