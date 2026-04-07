from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps workspace_id to a list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, workspace_id: int):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = []
        self.active_connections[workspace_id].append(websocket)

    def disconnect(self, websocket: WebSocket, workspace_id: int):
        if workspace_id in self.active_connections:
            self.active_connections[workspace_id].remove(websocket)
            if not self.active_connections[workspace_id]:
                del self.active_connections[workspace_id]

    async def broadcast_to_workspace(self, message: dict, workspace_id: int):
        """Sends a real-time JSON payload to all analysts currently viewing this workspace."""
        if workspace_id in self.active_connections:
            for connection in self.active_connections[workspace_id]:
                await connection.send_json(message)

# Global manager instance to be imported by other files
manager = ConnectionManager()

# The actual WebSocket endpoint the React frontend connects to
@router.websocket("/stream/{workspace_id}")
async def websocket_endpoint(websocket: WebSocket, workspace_id: int):
    await manager.connect(websocket, workspace_id)
    try:
        while True:
            # Keep the connection alive and listen for client pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, workspace_id)