from fastapi import APIRouter, Depends, Header, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List

from ..database import get_db
from ..models import Alert, User, Workspace
from ..schemas import AlertCreate, AlertResponse, AlertUpdateStatus
from .auth import get_current_user
from .ws import manager

router = APIRouter(prefix="/alerts", tags=["Alerts"])

async def verify_api_key(x_api_key: str = Header(None), db: AsyncSession = Depends(get_db)):
    """Verifies the sensor using the unique X-API-Key header."""
    result = await db.execute(select(Workspace).where(Workspace.api_key == x_api_key))
    workspace = result.scalars().first()
    if not workspace: 
        raise HTTPException(status_code=401, detail="Invalid Security Key.")
    return workspace

# --- 1. SENSOR INGESTION ---
@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_alert(
    alert_in: AlertCreate, 
    db: AsyncSession = Depends(get_db), 
    workspace: Workspace = Depends(verify_api_key)
):
    new_alert = Alert(**alert_in.dict(), workspace_id=workspace.id)
    db.add(new_alert)
    await db.commit()
    
    await manager.broadcast_to_workspace(
        {"event": "NEW_THREAT", "data": alert_in.dict()}, 
        workspace.id
    )
    return {"status": "Threat logged and broadcasted"}

# --- 2. STATIC ROUTES (Must come before dynamic {id} routes) ---
@router.get("/stats/overview")
async def get_alert_stats(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Calculates live metrics for the Overview Dashboard."""
    total_query = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.workspace_id == current_user.workspace_id,
            Alert.status == "new"
        )
    )
    total_pending = total_query.scalar() or 0

    critical_query = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.workspace_id == current_user.workspace_id,
            Alert.severity == "critical",
            Alert.status == "new"
        )
    )
    critical_threats = critical_query.scalar() or 0

    resolved_query = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.workspace_id == current_user.workspace_id,
            Alert.status == "reviewed"
        )
    )
    resolved_alerts = resolved_query.scalar() or 0

    return {
        "active_alerts": total_pending,
        "critical_threats": critical_threats,
        "resolved_alerts": resolved_alerts,
        "active_sensors": 1
    }

@router.get("/stats/analysis")
async def get_analysis_stats(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Generates deep intelligence metrics for the Analysis Dashboard."""
    
    # Top 5 Attacker IPs
    ip_query = await db.execute(
        select(Alert.source_ip, func.count(Alert.id).label("attack_count"))
        .where(Alert.workspace_id == current_user.workspace_id)
        .group_by(Alert.source_ip)
        .order_by(desc("attack_count"))
        .limit(5)
    )
    top_ips = [{"ip": row.source_ip, "count": row.attack_count} for row in ip_query]

    # Severity Distribution
    sev_query = await db.execute(
        select(Alert.severity, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == current_user.workspace_id)
        .group_by(Alert.severity)
    )
    severity_distribution = {row.severity: row.count for row in sev_query}

    # Protocol Distribution
    proto_query = await db.execute(
        select(Alert.protocol, func.count(Alert.id).label("count"))
        .where(Alert.workspace_id == current_user.workspace_id)
        .group_by(Alert.protocol)
    )
    protocol_distribution = {row.protocol: row.count for row in proto_query}

    return {
        "top_attackers": top_ips,
        "severity_distribution": severity_distribution,
        "protocol_distribution": protocol_distribution
    }

@router.get("/", response_model=List[AlertResponse])
async def get_workspace_alerts(
    status: str = "new",
    severity: str = "all",
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch alerts filtered by status."""
    query_status = "new" if status == "new" else "reviewed"
    query = select(Alert).where(
        Alert.workspace_id == current_user.workspace_id,
        Alert.status == query_status
    )
    
    # Apply severity filter if not 'all'
    if severity and severity != "all":
        query = query.where(Alert.severity == severity)

    result = await db.execute(query.order_by(Alert.timestamp.desc()))
    return result.scalars().all()

# --- 3. DYNAMIC ROUTES ({alert_id}) ---
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
    return alert

@router.patch("/{alert_id}/triage")
async def update_alert_triage(
    alert_id: int, 
    triage_data: AlertUpdateStatus, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows analysts to update threat status and add notes."""
    result = await db.execute(
        select(Alert).where(
            Alert.id == alert_id,
            Alert.workspace_id == current_user.workspace_id
        )
    )
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found.")
    
    alert.status = triage_data.status
    if hasattr(triage_data, 'notes') and triage_data.notes:
        alert.notes = triage_data.notes
        
    await db.commit()
    return {"message": "Triage data updated successfully."}