from fastapi import WebSocket
from typing import Dict, List
import json

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
            if websocket in self.active_connections[workspace_id]:
                self.active_connections[workspace_id].remove(websocket)
            # Clean up empty workspace lists to free memory
            if not self.active_connections[workspace_id]:
                del self.active_connections[workspace_id]

    async def broadcast_to_workspace(self, workspace_id: int, message: dict):
        """
        Sends a real-time JSON message to all users currently looking at the dashboard
        for a specific workspace.
        """
        if workspace_id in self.active_connections:
            for connection in self.active_connections[workspace_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Connection might be dead, remove it
                    self.disconnect(connection, workspace_id)

manager = ConnectionManager()