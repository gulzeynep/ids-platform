from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
from ..core.ws_manager import manager

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/stream/{workspace_id}")
async def websocket_endpoint(websocket: WebSocket, workspace_id: int):
    await manager.connect(websocket, workspace_id)
    try:
        while True:
            # Bağlantıyı canlı tutmak için ping/pong veya veri bekleme
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, workspace_id)