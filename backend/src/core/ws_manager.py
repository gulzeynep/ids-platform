from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Hangi şirket ID'sinde hangi WebSocket bağlantıları (kullanıcılar) açık onu tutarız
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, company_id: int):
        await websocket.accept()
        if company_id not in self.active_connections:
            self.active_connections[company_id] = []
        self.active_connections[company_id].append(websocket)

    def disconnect(self, websocket: WebSocket, company_id: int):
        if company_id in self.active_connections:
            if websocket in self.active_connections[company_id]:
                self.active_connections[company_id].remove(websocket)
            # Eğer şirketteki son analist de çıkış yaptıysa listeyi temizle
            if not self.active_connections[company_id]:
                del self.active_connections[company_id]

    async def broadcast_to_company(self, message: dict, company_id: int):
        # Sadece ilgili şirketin açık ekranlarına alarmı fırlat!
        if company_id in self.active_connections:
            for connection in self.active_connections[company_id]:
                await connection.send_json(message)

# Tüm projenin kullanacağı tek bir yönetici nesnesi oluşturuyoruz
manager = ConnectionManager()