import uuid
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import Role, User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import LoginRequest, PasswordChangeRequest, RegisterRequest, Token


class AuthService:
    @staticmethod
    def generate_tokens_for_user(user: User) -> Token:
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.name if user.role else "customer",
        }
        access_token = create_access_token(data=payload)
        refresh_token = create_refresh_token(data=payload)
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
        )

    @classmethod
    async def register(cls, db: AsyncSession, register_in: RegisterRequest) -> Tuple[User, Token]:
        existing_user = await UserRepository.get_by_email(db, register_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        customer_role = await UserRepository.get_or_create_role(
            db, name="customer", description="Standard customer storefront access"
        )

        hashed_password = get_password_hash(register_in.password)
        user = await UserRepository.create_user(
            db=db,
            email=register_in.email,
            hashed_password=hashed_password,
            first_name=register_in.first_name,
            last_name=register_in.last_name,
            role_id=customer_role.id,
            phone=register_in.phone,
            is_active=True,
            is_verified=False,
        )

        tokens = cls.generate_tokens_for_user(user)
        return user, tokens

    @classmethod
    async def login(cls, db: AsyncSession, login_in: LoginRequest) -> Tuple[User, Token]:
        user = await UserRepository.get_by_email(db, login_in.email)
        if not user or not verify_password(login_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This user account has been disabled.",
            )

        tokens = cls.generate_tokens_for_user(user)
        return user, tokens

    @classmethod
    async def refresh_token(cls, db: AsyncSession, refresh_token_str: str) -> Token:
        try:
            payload = decode_token(refresh_token_str)
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is not a valid refresh token.",
            )

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject.",
            )

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token subject.",
            )

        user = await UserRepository.get_by_id(db, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer active or exists.",
            )

        return cls.generate_tokens_for_user(user)

    @classmethod
    async def change_password(
        cls, db: AsyncSession, user: User, password_in: PasswordChangeRequest
    ) -> bool:
        if not verify_password(password_in.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password does not match.",
            )

        new_hashed = get_password_hash(password_in.new_password)
        await UserRepository.update_user(db, user, {"hashed_password": new_hashed})
        return True

    @classmethod
    async def init_default_roles_and_admin(cls, db: AsyncSession) -> None:
        """Seeds default roles ('admin', 'customer') and the initial superuser if not present."""
        admin_role = await UserRepository.get_or_create_role(
            db, name="admin", description="Full administrative access"
        )
        await UserRepository.get_or_create_role(
            db, name="customer", description="Standard customer storefront access"
        )

        existing_admin = await UserRepository.get_by_email(db, settings.FIRST_SUPERUSER_EMAIL)
        if not existing_admin:
            names = settings.FIRST_SUPERUSER_NAME.split(" ", 1)
            first_name = names[0]
            last_name = names[1] if len(names) > 1 else "Admin"
            await UserRepository.create_user(
                db=db,
                email=settings.FIRST_SUPERUSER_EMAIL,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                first_name=first_name,
                last_name=last_name,
                role_id=admin_role.id,
                is_active=True,
                is_verified=True,
            )
