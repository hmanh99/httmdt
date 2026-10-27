from typing import List, Optional
import uuid
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from app.models.user import Address, Role, User
from app.schemas.user import AddressCreate, AddressUpdate


class UserRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.id == user_id, User.is_deleted == False)  # noqa: E712
            .options(joinedload(User.role))
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.email == email.lower().strip(), User.is_deleted == False)  # noqa: E712
            .options(joinedload(User.role))
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_role_by_name(db: AsyncSession, name: str) -> Optional[Role]:
        stmt = select(Role).where(Role.name == name.lower().strip())
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_role(db: AsyncSession, name: str, description: Optional[str] = None) -> Role:
        role = Role(name=name.lower().strip(), description=description)
        db.add(role)
        await db.commit()
        await db.refresh(role)
        return role

    @staticmethod
    async def get_or_create_role(db: AsyncSession, name: str, description: Optional[str] = None) -> Role:
        role = await UserRepository.get_role_by_name(db, name)
        if not role:
            role = await UserRepository.create_role(db, name, description)
        return role

    @staticmethod
    async def create_user(
        db: AsyncSession,
        email: str,
        hashed_password: str,
        first_name: str,
        last_name: str,
        role_id: uuid.UUID,
        phone: Optional[str] = None,
        is_active: bool = True,
        is_verified: bool = False,
    ) -> User:
        user = User(
            email=email.lower().strip(),
            hashed_password=hashed_password,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            role_id=role_id,
            phone=phone.strip() if phone else None,
            is_active=is_active,
            is_verified=is_verified,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def update_user(db: AsyncSession, user: User, update_data: dict) -> User:
        for field, value in update_data.items():
            if hasattr(user, field) and value is not None:
                setattr(user, field, value)
        await db.commit()
        await db.refresh(user)
        return user

    # Addresses
    @staticmethod
    async def get_addresses(db: AsyncSession, user_id: uuid.UUID) -> List[Address]:
        stmt = select(Address).where(Address.user_id == user_id).order_by(Address.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_address_by_id(db: AsyncSession, address_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Address]:
        stmt = select(Address).where(Address.id == address_id, Address.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_address(db: AsyncSession, user_id: uuid.UUID, address_in: AddressCreate) -> Address:
        if address_in.is_default_shipping:
            # Clear existing default shipping
            await db.execute(
                update(Address)
                .where(Address.user_id == user_id)
                .values(is_default_shipping=False)
            )
        if address_in.is_default_billing:
            # Clear existing default billing
            await db.execute(
                update(Address)
                .where(Address.user_id == user_id)
                .values(is_default_billing=False)
            )

        address = Address(
            user_id=user_id,
            **address_in.model_dump(),
        )
        db.add(address)
        await db.commit()
        await db.refresh(address)
        return address

    @staticmethod
    async def update_address(
        db: AsyncSession,
        address: Address,
        address_in: AddressUpdate,
    ) -> Address:
        update_data = address_in.model_dump(exclude_unset=True)
        if update_data.get("is_default_shipping"):
            await db.execute(
                update(Address)
                .where(Address.user_id == address.user_id, Address.id != address.id)
                .values(is_default_shipping=False)
            )
        if update_data.get("is_default_billing"):
            await db.execute(
                update(Address)
                .where(Address.user_id == address.user_id, Address.id != address.id)
                .values(is_default_billing=False)
            )

        for field, value in update_data.items():
            setattr(address, field, value)

        await db.commit()
        await db.refresh(address)
        return address

    @staticmethod
    async def delete_address(db: AsyncSession, address: Address) -> None:
        await db.delete(address)
        await db.commit()
