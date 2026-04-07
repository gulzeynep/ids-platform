from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import User, Workspace, Notification
from ..schemas import UserResponse, WorkspaceResponse
from .auth import get_current_user

router = APIRouter(prefix="/management", tags=["User & Workspace Management"])

# --- USER SETTINGS ---
@router.patch("/settings")
def update_user_settings(
    settings_in: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Updates operative notification preferences and profile details."""
    current_user.alert_email = settings_in.get("alert_email", current_user.alert_email)
    current_user.enable_email_notifications = settings_in.get("enable_email_notifications", current_user.enable_email_notifications)
    current_user.enable_in_app_notifications = settings_in.get("enable_in_app_notifications", current_user.enable_in_app_notifications)
    current_user.min_severity_level = settings_in.get("min_severity_level", current_user.min_severity_level)

    db.commit()
    return {"status": "success", "message": "Neural settings updated."}

# --- NOTIFICATIONS ---
@router.get("/notifications")
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches the latest 20 security or system notifications for the current workspace."""
    notifications = db.query(Notification)\
        .filter(Notification.workspace_id == current_user.workspace_id)\
        .order_by(Notification.timestamp.desc())\
        .limit(20)\
        .all()
    return notifications

@router.post("/notifications/{notif_id}/read")
def mark_notification_as_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks a specific notification as acknowledged."""
    notif = db.query(Notification).filter(
        Notification.id == notif_id, 
        Notification.workspace_id == current_user.workspace_id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found in your sector.")
    
    notif.is_read = True
    db.commit()
    return {"message": "Notification cleared."}

# --- TEAM MANAGEMENT (Workspace Admin Only) ---
@router.get("/team", response_model=List[UserResponse])
def get_workspace_team(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all operatives assigned to the current workspace."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Clearance level insufficient.")
        
    team = db.query(User).filter(User.workspace_id == current_user.workspace_id).all()
    return team

# --- PERFORMANCE METRICS ---
@router.get("/my-performance")
def get_my_stats(user: User = Depends(get_current_user)):
    """Simple status check for the current operative."""
    return {
        "operative": user.email,
        "role": user.role,
        "workspace_id": user.workspace_id,
        "status": "Active"
    }