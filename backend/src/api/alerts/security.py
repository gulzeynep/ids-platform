from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...models import User
from ...core.security import get_current_admin_user
from ...core.redis import get_redis
from ...services.security_service import SecurityService

router = APIRouter(prefix="/security", tags=["Security Enforcement"])

def get_security_service(
    db: AsyncSession = Depends(get_db), 
    redis_client = Depends(get_redis)
) -> SecurityService:
    """Dependency injector for SecurityService."""
    return SecurityService(db=db, redis_client=redis_client)

@router.post("/blacklist/{ip_address}", status_code=status.HTTP_201_CREATED)
async def blacklist_ip(
    ip_address: str,
    reason: str = "Manual Admin Block",
    service: SecurityService = Depends(get_security_service),
    admin: User = Depends(get_current_admin_user)
):
    """
    Blacklists an IP address for the active workspace.
    Only accessible by workspace administrators.
    """
    await service.blacklist_ip(
        ip_address=ip_address,
        reason=reason,
        workspace_id=admin.workspace_id,
        admin_id=admin.id
    )
    
    return {"message": f"IP {ip_address} is now blacklisted."}