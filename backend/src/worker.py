import asyncio
import json

from src.core.logger import logger
from src.core.mailer import send_security_alert, should_send_alert_email
from src.core.queue import publish_alert_event, redis_client
from src.database import AsyncSessionLocal
from src.models import Alert, User
from src.schemas import serialize_alert_contract
from sqlalchemy import select


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

                        users_result = await db.execute(select(User).where(User.workspace_id == workspace_id))
                        notification_users = users_result.scalars().all()

                    alert_data = serialize_alert_contract(new_alert)
                    await publish_alert_event(
                        {
                            "type": "alert",
                            "workspace_id": workspace_id,
                            "data": alert_data,
                            "timestamp": alert_data["timestamp"],
                        }
                    )

                    for user in notification_users:
                        recipient = user.alert_email or user.email
                        if not should_send_alert_email(
                            enabled=user.enable_email_notifications is not False,
                            recipient=recipient,
                            severity=new_alert.severity,
                            min_severity_level=user.min_severity_level or "high",
                        ):
                            continue
                        try:
                            await send_security_alert(
                                recipient,
                                new_alert.type,
                                new_alert.severity,
                                new_alert.source_ip,
                            )
                        except Exception as exc:
                            logger.error(f"Email alert delivery failed for user {user.id}: {exc}")

                    await redis_client.xdel("alert_stream", msg_id)
                    logger.info(f"Processed & published alert: {payload['type']}")

        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(process_alerts())
