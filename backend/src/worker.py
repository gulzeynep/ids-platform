import asyncio
import json

from src.core.logger import logger
from src.core.mailer import send_security_alert, should_send_alert_email
from src.core.queue import publish_alert_event, redis_client
from src.database import AsyncSessionLocal
from src.models import Alert, User
from src.schemas import build_alert_title, serialize_alert_contract
from sqlalchemy import select


async def deliver_alert_emails(alert: Alert, users: list[User]) -> None:
    title = build_alert_title(
        alert.severity,
        alert.payload_preview,
        alert.type,
        alert.signature_msg,
    )

    for user in users:
        recipient = user.alert_email or user.email
        if not should_send_alert_email(
            enabled=user.enable_email_notifications is not False,
            recipient=recipient,
            severity=alert.severity,
            min_severity_level=user.min_severity_level or "high",
        ):
            continue
        try:
            await send_security_alert(
                recipient,
                alert.type,
                alert.severity,
                alert.source_ip,
                destination_ip=alert.destination_ip,
                title=title,
                timestamp=alert.timestamp,
            )
        except Exception:
            logger.warning(
                "Alert email delivery failed for user_id=%s alert_id=%s; continuing worker processing.",
                user.id,
                alert.id,
                exc_info=True,
            )


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

                    await deliver_alert_emails(new_alert, notification_users)

                    await redis_client.xdel("alert_stream", msg_id)
                    logger.info(
                        "Processed alert event type=%s workspace_id=%s",
                        payload.get("type"),
                        workspace_id,
                    )

        except Exception:
            logger.exception("Alert worker loop failed; retrying after backoff.")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(process_alerts())
