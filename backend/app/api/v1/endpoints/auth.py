from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import (
    LoginRequest,
    PasswordChangeRequest,
    RefreshTokenRequest,
    RegisterRequest,
    Token,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserRead, UserUpdate
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    register_in: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Registers a new customer account and returns JWT authentication tokens."""
    user, tokens = await AuthService.register(db, register_in)
    return {
        "user": UserRead.model_validate(user),
        "tokens": tokens,
    }


@router.post("/login", response_model=dict)
async def login(
    login_in: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticates a user and returns JWT access and refresh tokens."""
    user, tokens = await AuthService.login(db, login_in)
    return {
        "user": UserRead.model_validate(user),
        "tokens": tokens,
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_in: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Rotates/renews an expired access token using a valid refresh token."""
    return await AuthService.refresh_token(db, refresh_in.refresh_token)


@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """Retrieves the authenticated user's profile and assigned role."""
    return current_user


@router.put("/me", response_model=UserRead)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates profile information (name, phone) for the authenticated user."""
    updated = await UserRepository.update_user(
        db, current_user, user_update.model_dump(exclude_unset=True)
    )
    return updated


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_in: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Changes the current authenticated user's password."""
    await AuthService.change_password(db, current_user, password_in)
    return MessageResponse(message="Password successfully updated.")


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_active_user),
):
    """Acknowledges user logout."""
    return MessageResponse(message="Successfully logged out.")
