import json 
import redis.asyncio as redis 
from src.core.logger import logger

from config import Settings

REDIS_HOST = Settings.REDIS_HOST
REDIS_PORT = Settings.REDIS_PORT

# async client 
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

async def add_to_queue(alert_data: dict):
    try:
        await redis_client.xadd("alert_stream", {"payload": json.dumps(alert_data)})
    except Exception as e:
        logger.error(f"Error adding to queue: {e}")