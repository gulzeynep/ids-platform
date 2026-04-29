from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..database import get_db
from ..models import BlacklistedIP, User
from ..schemas import BlacklistCreate, BlacklistResponse
from ..core.security import get_current_user
from ..core.queue import redis_client

router = APIRouter(prefix="/defense", tags=["Defense Operations"])

@router.post("/blacklist", response_model=BlacklistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_blacklist(
    data: BlacklistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adds a malicious IP to the workspace blacklist and syncs with Redis cache."""
    # Check if already blacklisted
    result = await db.execute(
        select(BlacklistedIP).where(
            BlacklistedIP.ip_address == data.ip_address,
            BlacklistedIP.workspace_id == current_user.workspace_id
        )
    )
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="IP is already blacklisted.")

    # Save to Database
    new_ban = BlacklistedIP(
        ip_address=data.ip_address,
        reason=data.reason,
        created_by=current_user.id,
        workspace_id=current_user.workspace_id
    )
    db.add(new_ban)
    await db.commit()
    await db.refresh(new_ban)

    # Sync with Redis for ultra-fast sensor blocking
    redis_key = f"blacklist:workspace:{current_user.workspace_id}"
    await redis_client.sadd(redis_key, data.ip_address)

    return new_ban

@router.delete("/blacklist/{ip_address}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_blacklist(
    ip_address: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Removes an IP from the workspace blacklist (Release)."""
    result = await db.execute(
        select(BlacklistedIP).where(
            BlacklistedIP.ip_address == ip_address,
            BlacklistedIP.workspace_id == current_user.workspace_id
        )
    )
    banned_ip = result.scalars().first()
    
    if not banned_ip:
        raise HTTPException(status_code=404, detail="IP not found in blacklist.")

    # Remove from Database
    await db.delete(banned_ip)
    await db.commit()

    # Remove from Redis Cache
    redis_key = f"blacklist:workspace:{current_user.workspace_id}"
    await redis_client.srem(redis_key, ip_address)

    return None