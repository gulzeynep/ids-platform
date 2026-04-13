from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..core.ws_manager import manager

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/stream/{workspace_id}")
async def websocket_endpoint(websocket: WebSocket, workspace_id: int):
    """
    Frontend React app connects to this endpoint to receive real-time threat alerts.
    """
    await manager.connect(websocket, workspace_id)
    try:
        while True:
            # We keep the connection alive. You can also accept simple pings here.
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, workspace_id)