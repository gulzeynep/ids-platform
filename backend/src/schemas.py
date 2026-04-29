from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import re 

# Auth and User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str

    @field_validator('email')
    @classmethod
    def trim_and_lower(cls, v: str) -> str:
        return v.strip().lower()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v:str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*()-+_.]", v):
            raise ValueError("Password must contain at least one special character.")

class UserProfileUpdate(BaseModel):
    """Onboarding Setup"""
    full_name: str
    company_name: str 
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

# Workspcae Schemas
class WorkspaceResponse(BaseModel):
    id: int
    name: str
    subscription_plan: str
    api_key: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Alert Schemas
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
    """to display alerts"""
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
    notes: Optional[str] = None
    payload_preview: Optional[str]
    
    is_flagged: bool = False
    is_saved: bool = fal
    
    timestamp: datetime
    workspace_id: int
    class Config:
        from_attributes = True

class AlertUpdateStatus(BaseModel):
    """Used by Analysts to update the status of an alert"""
    status: Optional[str] = None
    notes: Optional[str] = None
    is_flagged: Optional[bool] = None
    is_saved: Optional[bool] = None 

# Defense and Blacklist Schemas
class BlacklistCreate(BaseModel):
    ip_address: str
    reason: Optional[str] = "Malicious activity detected by analyst"

class BlacklistResponse(BaseModel):
    id: int
    ip_address: str
    reason: Optional[str]
    created_by: Optional[int]
    timestamp: datetime
    workspace_id: int

    class Config:
        from_attributes = True