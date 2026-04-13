import asyncio
import json
import logging
from redis.asyncio import Redis

from src.core.config import settings
from src.database import AsyncSessionLocal
from src.schemas import AlertCreate
from src.services.alert_service import AlertService

# Setup minimal logging for the worker
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WIDS-Worker")

async def process_threat_queue():
    """
    Background worker that listens to a Redis queue for incoming raw sensor data,
    processes it, and saves it via the AlertService.
    """
    redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    queue_name = "sensor_alerts_queue"
    
    logger.info(f"Worker started. Listening to Redis queue: {queue_name}")
    
    try:
        while True:
            # Block until a message is available in the queue (BLPOP)
            result = await redis_client.blpop(queue_name, timeout=0)
            if not result:
                continue
                
            _, message_data = result
            
            try:
                payload = json.loads(message_data)
                
                # Assume payload contains 'workspace_id' and alert data
                workspace_id = payload.get("workspace_id")
                alert_data = AlertCreate(**payload.get("alert"))
                
                # Use our fresh Async Database Session
                async with AsyncSessionLocal() as session:
                    alert_service = AlertService(session)
                    
                    # This method automatically triggers WebSocket broadcast!
                    await alert_service.create_alert(
                        alert_data=alert_data,
                        workspace_id=workspace_id
                    )
                    
                logger.info(f"Processed and saved alert for IP: {alert_data.source_ip}")
                
            except Exception as e:
                logger.error(f"Failed to process message: {e}")
                
    except asyncio.CancelledError:
        logger.info("Worker shutdown gracefully.")
    finally:
        await redis_client.aclose()

if __name__ == "__main__":
    try:
        asyncio.run(process_threat_queue())
    except KeyboardInterrupt:
        pass