import asyncio
import json
from contextlib import suppress

from src.core.logger import logger
from src.core.queue import ALERT_EVENTS_CHANNEL, redis_client
from src.core.ws_manager import manager


_broadcast_task: asyncio.Task | None = None


async def _broadcast_loop() -> None:
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(ALERT_EVENTS_CHANNEL)
    logger.info("Redis alert broadcaster subscribed to alert_events")
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if not message:
                await asyncio.sleep(0.05)
                continue

            try:
                payload = json.loads(message["data"])
                workspace_id = payload.get("workspace_id")
                if not workspace_id:
                    continue
                ws_message = {
                    "type": payload.get("type", "alert"),
                    "data": payload.get("data"),
                    "timestamp": payload.get("timestamp"),
                }
                await manager.broadcast_to_workspace(ws_message, int(workspace_id))
            except Exception as exc:
                logger.error(f"Redis alert broadcast error: {exc}")
    finally:
        with suppress(Exception):
            await pubsub.unsubscribe(ALERT_EVENTS_CHANNEL)
            await pubsub.close()


async def start_realtime_broadcaster() -> None:
    global _broadcast_task
    if _broadcast_task and not _broadcast_task.done():
        return
    _broadcast_task = asyncio.create_task(_broadcast_loop())


async def stop_realtime_broadcaster() -> None:
    global _broadcast_task
    if not _broadcast_task:
        return
    _broadcast_task.cancel()
    with suppress(asyncio.CancelledError):
        await _broadcast_task
    _broadcast_task = None
