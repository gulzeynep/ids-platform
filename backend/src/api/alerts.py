from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Header
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import Alert, User, Notification, Workspace
from ..schemas import AlertCreate, AlertResponse
from .auth import get_current_user
from .ws import manager  # <--- CORRECT IMPORT!

router = APIRouter()

# --- DEPENDENCY FOR SENSOR AUTHENTICATION ---
def verify_api_key(x_api_key: str = Header(None), db: Session = Depends(get_db)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header.")
    workspace = db.query(Workspace).filter(Workspace.api_key == x_api_key).first()
    if not workspace:
        raise HTTPException(status_code=401, detail="Invalid API Key.")
    return workspace

# ==========================================
# 1. THE INGESTION ENDPOINT (For the Sensor)
# ==========================================
@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(verify_api_key)
):
    """
    Called by the external Python/C++ W-IDS Sensor using an API Key.
    """
    # 1. Save to Database (Isolated by Workspace)
    new_alert = Alert(
        type=alert_in.type,
        severity=alert_in.severity,
        source_ip=alert_in.source_ip,
        destination_ip=alert_in.destination_ip,
        source_port=alert_in.source_port,
        destination_port=alert_in.destination_port,
        protocol=alert_in.protocol,
        action=alert_in.action,
        payload_preview=alert_in.payload_preview,
        workspace_id=current_workspace.id
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    # 2. Push Real-Time Update to the War Room (React Dashboard)
    await manager.broadcast_to_workspace({
        "event_type": "NEW_THREAT_DETECTED",
        "data": {
            "id": new_alert.id,
            "type": new_alert.type,
            "severity": new_alert.severity,
            "source_ip": new_alert.source_ip,
            "timestamp": new_alert.timestamp.isoformat()
        }
    }, current_workspace.id)

    return {"status": "Threat logged and broadcasted successfully"}

# ==========================================
# 2. THE FETCH ENDPOINT (For the React Frontend)
# ==========================================
@router.get("/", response_model=List[AlertResponse])
def get_workspace_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 100
):
    """
    Called by the React Frontend to populate the table.
    Only returns alerts that belong to the user's workspace.
    """
    if not current_user.workspace_id:
        return []

    alerts = db.query(Alert)\
        .filter(Alert.workspace_id == current_user.workspace_id)\
        .order_by(Alert.timestamp.desc())\
        .limit(limit)\
        .all()
        
    return alerts