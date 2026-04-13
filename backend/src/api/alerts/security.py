from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models import User, BlacklistedIP
from ...core.security import get_current_admin_user
from ...core.redis import get_redis

router = APIRouter(prefix="/security", tags=["Security Enforcement"])

@router.post("/blacklist/{ip_address}")
async def blacklist_ip(
    ip_address: str,
    reason: str = "Manual Admin Block",
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis),
    admin: User = Depends(get_current_admin_user)
):
    # 1. DB
    new_ban = BlacklistedIP(ip_address=ip_address, reason=reason, workspace_id=admin.workspace_id, created_by=admin.id)
    db.add(new_ban)
    
    # 2. Redis
    redis_key = f"blacklist:{admin.workspace_id}"
    await redis.sadd(redis_key, ip_address)
    
    await db.commit()
    return {"message": f"IP {ip_address} is now blacklisted."}