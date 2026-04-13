import redis.asyncio as redis
from typing import AsyncGenerator
from src.core.config import settings

async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    """
    Dependency generator for Redis connections.
    Properly handles connection pooling and cleanup.
    """
    redis_client = await redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield redis_client
    finally:
        await redis_client.aclose()