import json 
import asyncio
from src.core.queue import redis_client
from src.database import AsyncSessionLocal
from src.models import Alert
from src.core.logger import logger

async def process_alerts():
    logger.info("Starting alert processing worker, listening to queue...")
    while True:
        try:
            messages = await redis_client.xread({"alert_stream": "0-0"}, count=1, block=5000)
            if messages: 
                for stream, msgs in messages:
                    for msg_id, data in msgs:
                        payload = json.loads(data["payload"])

                        async with AsyncSessionLocal() as db:
                            new_alert = Alert(**payload)
                            db.add(new_alert)
                            await db.commit()

                        await redis_client.xdel("alert_stream", msg_id)
                        logger.info(f"Processed alert: {payload['type']}")

        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(5) 

if __name__ == "__main__":
    asyncio.run(process_alerts())