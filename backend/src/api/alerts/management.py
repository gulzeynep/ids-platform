from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from datetime import datetime
from pathlib import Path
import json

from src.database import get_db
from src.models import Alert, User
from src.schemas import AlertResponse, AlertUpdateStatus
from src.core.security import get_current_user
from src.schemas import build_alert_title
from snort_bridge import extract_raw_request_from_pcap

router = APIRouter()


def serialize_alert(alert: Alert) -> AlertResponse:
    response = AlertResponse.model_validate(alert)
    response.title = build_alert_title(alert.severity, alert.payload_preview, alert.type, alert.signature_msg)
    return response


def extract_capture_pcap_path(capture_path: Optional[str]) -> Optional[Path]:
    if not capture_path:
        return None

    path = Path(capture_path)
    if path.suffix.lower() == ".pcap":
        return path

    if path.suffix.lower() == ".json" and path.exists():
        try:
            metadata = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None
        pcap_path = metadata.get("pcap_path")
        if pcap_path:
            return Path(pcap_path)

    return None


async def hydrate_raw_request_from_capture(alert: Alert, db: AsyncSession) -> None:
    if alert.raw_request:
        return

    pcap_path = extract_capture_pcap_path(alert.capture_path)
    if not pcap_path:
        return

    raw_request = extract_raw_request_from_pcap(pcap_path)
    if not raw_request:
        return

    alert.raw_request = raw_request
    await db.commit()
    await db.refresh(alert)

@router.get("/", response_model=List[AlertResponse])
async def get_workspace_alerts(
    status: Optional[str] = "new",
    severity: Optional[str] = "all",
    is_saved: Optional[bool] = None,
    is_flagged: Optional[bool] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch and filter alerts for the Intrusions Datatable."""
    query = select(Alert).where(Alert.workspace_id == current_user.workspace_id)
    
    if status and status != "all":
        query = query.where(Alert.status == status)
    if severity and severity != "all":
        query = query.where(Alert.severity == severity)
    if is_saved is not None:
        query = query.where(Alert.is_saved == is_saved)
    if is_flagged is not None:
        query = query.where(Alert.is_flagged == is_flagged)
    if search:
        like = f"%{search}%"
        query = query.where(
            or_(
                Alert.type.ilike(like),
                Alert.source_ip.ilike(like),
                Alert.destination_ip.ilike(like),
                Alert.payload_preview.ilike(like),
                Alert.raw_request.ilike(like),
                Alert.signature_msg.ilike(like),
                Alert.signature_class.ilike(like),
            )
        )
    if start_date:
        query = query.where(Alert.timestamp >= start_date)
    if end_date:
        query = query.where(Alert.timestamp <= end_date)

    result = await db.execute(query.order_by(Alert.timestamp.desc()).offset(offset).limit(limit))
    return [serialize_alert(alert) for alert in result.scalars().all()]

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert_detail(
    alert_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch full intelligence details for a specific alert."""
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id, 
            Alert.workspace_id == current_user.workspace_id
        )
    )
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Intelligence record not found.")
    await hydrate_raw_request_from_capture(alert, db)
    return serialize_alert(alert)

@router.patch("/{alert_id}/triage")
async def update_alert_triage(
    alert_id: int, 
    triage_data: AlertUpdateStatus, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
) -> AlertResponse:
    """Universal update endpoint for status, notes, flags, and saves."""
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id, 
            Alert.workspace_id == current_user.workspace_id
        )
    )
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found.")
    
    # Only update fields that were explicitly sent in the request
    update_data = triage_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(alert, key, value)
        
    await db.commit()
    await db.refresh(alert)
    return serialize_alert(alert)
