import redis 
import json 
import os 
from src.core.logger import logger

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
def add_to_queue(aler_data: dict):
    try:
        redis_client.xadd("alert_stream", {"payload": json.dumps(aler_data)})
    except Exception as e:
        logger.error(f"Error adding to queue: {e}")
