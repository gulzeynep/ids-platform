import asyncio
import json

from src.core.logger import logger
from src.core.queue import redis_client
from src.core.ws_manager import manager
from src.database import AsyncSessionLocal
from src.models import Alert


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

                    alert_data = {
                        "id": new_alert.id,
                        "type": new_alert.type,
                        "severity": new_alert.severity,
                        "source_ip": new_alert.source_ip,
                        "destination_ip": new_alert.destination_ip,
                        "source_port": new_alert.source_port,
                        "destination_port": new_alert.destination_port,
                        "protocol": new_alert.protocol,
                        "action": new_alert.action,
                        "status": new_alert.status,
                        "payload_preview": new_alert.payload_preview,
                        "timestamp": new_alert.timestamp.isoformat(),
                        "workspace_id": new_alert.workspace_id,
                        "is_flagged": new_alert.is_flagged,
                        "is_saved": new_alert.is_saved,
                    }

                    try:
                        await manager.broadcast_to_workspace(alert_data, workspace_id)
                    except Exception as exc:
                        logger.error(f"WebSocket broadcast error: {exc}")

                    await redis_client.xdel("alert_stream", msg_id)
                    logger.info(f"Processed & broadcast alert: {payload['type']}")

        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(process_alerts())
