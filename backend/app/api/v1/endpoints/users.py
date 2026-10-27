from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.common import MessageResponse
from app.schemas.user import AddressCreate, AddressRead, AddressUpdate

router = APIRouter(prefix="/users", tags=["Users & Addresses"])


@router.get("/addresses", response_model=List[AddressRead])
async def list_addresses(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves all saved addresses for the authenticated user."""
    return await UserRepository.get_addresses(db, current_user.id)


@router.post("/addresses", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
async def create_address(
    address_in: AddressCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new shipping or billing address for the authenticated user."""
    return await UserRepository.create_address(db, current_user.id, address_in)


@router.put("/addresses/{address_id}", response_model=AddressRead)
async def update_address(
    address_id: uuid.UUID,
    address_in: AddressUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates an existing address owned by the authenticated user."""
    address = await UserRepository.get_address_by_id(db, address_id, current_user.id)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found or does not belong to you.",
        )
    return await UserRepository.update_address(db, address, address_in)


@router.delete("/addresses/{address_id}", response_model=MessageResponse)
async def delete_address(
    address_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes an address owned by the authenticated user."""
    address = await UserRepository.get_address_by_id(db, address_id, current_user.id)
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found or does not belong to you.",
        )
    await UserRepository.delete_address(db, address)
    return MessageResponse(message="Address deleted successfully.")
