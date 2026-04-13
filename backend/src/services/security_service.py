from sqlalchemy.ext.asyncio import AsyncSession
from src.models import BlacklistedIP

class SecurityService:
    def __init__(self, db: AsyncSession, redis_client):
        self.db = db
        self.redis = redis_client

    async def blacklist_ip(self, ip_address: str, reason: str, workspace_id: int, admin_id: int) -> BlacklistedIP:
        """
        Adds an IP address to the PostgreSQL database and Redis blacklist set.
        """
        # 1. Add to Database
        new_ban = BlacklistedIP(
            ip_address=ip_address, 
            reason=reason, 
            workspace_id=workspace_id, 
            created_by=admin_id
        )
        self.db.add(new_ban)
        
        # 2. Add to Redis Cache
        redis_key = f"blacklist:{workspace_id}"
        await self.redis.sadd(redis_key, ip_address)
        
        # 3. Commit transaction
        await self.db.commit()
        await self.db.refresh(new_ban)
        
        return new_ban