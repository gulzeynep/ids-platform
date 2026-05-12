import asyncio
import json

from src.core.logger import logger
from src.core.queue import publish_alert_event, redis_client
from src.database import AsyncSessionLocal
from src.models import Alert
from src.schemas import serialize_alert_contract


async def process_alerts():
    logger.info("Starting alert processing worker, listening to queue...")
    while True:
        try:
            messages = await redis_client.xread({"alert_stream": "0-0"}, count=1, block=5000)
            if not messages:
                continue

            for stream, msgs in messages:
                for msg_id, data in msgs:
                    payload = json.loads(data["payload"])
                    workspace_id = payload.get("workspace_id")

                    async with AsyncSessionLocal() as db:
                        new_alert = Alert(**payload)
                        db.add(new_alert)
                        await db.commit()
                        await db.refresh(new_alert)

                    alert_data = serialize_alert_contract(new_alert)
                    await publish_alert_event(
                        {
                            "type": "alert",
                            "workspace_id": workspace_id,
                            "data": alert_data,
                            "timestamp": alert_data["timestamp"],
                        }
                    )

                    await redis_client.xdel("alert_stream", msg_id)
                    logger.info(f"Processed & published alert: {payload['type']}")

        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(process_alerts())
