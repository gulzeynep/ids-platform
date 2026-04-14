from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

# ==========================================
# AUTH & USER SCHEMAS
# ==========================================

class UserRegister(BaseModel):
    """Step 1: Just Email and Password"""
    email: EmailStr
    password: str

    @field_validator('email')
    @classmethod
    def trim_and_lower(cls, v: str) -> str:
        return v.strip().lower()

class UserProfileUpdate(BaseModel):
    """Step 2: Onboarding Setup"""
    full_name: str
    company_name: str # Maps to Workspace Name
    plan: str
    user_persona: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    user_persona: Optional[str]
    workspace_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True

# ==========================================
# WORKSPACE SCHEMAS
# ==========================================

class WorkspaceResponse(BaseModel):
    id: int
    name: str
    subscription_plan: str
    api_key: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# ALERT SCHEMAS
# ==========================================

class AlertCreate(BaseModel):
    """Used by the Python Sensor to send data to the backend"""
    type: str
    severity: str
    source_ip: str
    destination_ip: str
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    protocol: str = "TCP"
    action: str = "logged"
    payload_preview: Optional[str] = None

    @field_validator('severity')
    @classmethod
    def validate_severity(cls, v: str) -> str:
        cleaned = v.strip().lower()
        allowed = ['low', 'medium', 'high', 'critical']
        if cleaned not in allowed:
            raise ValueError(f"Severity must be one of {allowed}")
        return cleaned

class AlertResponse(BaseModel):
    """Used by the React Frontend to display alerts"""
    id: int
    type: str
    severity: str
    source_ip: str
    destination_ip: str
    source_port: Optional[int]
    destination_port: Optional[int]
    protocol: str
    action: str
    status: str
    payload_preview: Optional[str]
    timestamp: datetime
    workspace_id: int

    class Config:
        from_attributes = True

class AlertUpdateStatus(BaseModel):
    """Used by Analysts to update the status of an alert"""
    status: str # new, reviewing, reviewed, false_positive