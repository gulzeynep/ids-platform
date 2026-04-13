import redis.asyncio as redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://ids_redis:6379/0")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

async def get_redis():
    return redis_client