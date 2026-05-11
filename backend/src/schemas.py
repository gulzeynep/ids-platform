from pydantic import BaseModel, EmailStr, computed_field, field_validator
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
        return v
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

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
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
        return v

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
    title: str = ""
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
    is_saved: bool = False
    
    timestamp: datetime
    workspace_id: int

    @computed_field
    @property
    def display_title(self) -> str:
        return build_alert_title(self.severity, self.payload_preview, self.type)

    class Config:
        from_attributes = True


def build_alert_title(severity: str, payload_preview: Optional[str], fallback: str) -> str:
    if not payload_preview:
        return f"{severity.title()}: {fallback}"

    raw_msg = payload_preview
    if payload_preview.startswith("[") and "]" in payload_preview:
        raw_msg = payload_preview[1:payload_preview.index("]")]

    normalized = raw_msg.replace("LOCAL-OFFICIAL-", "").strip()
    lowered = normalized.lower()

    if "shadow" in lowered or "/etc/shadow" in lowered:
        name = "Shadow File Access"
    elif "passwd" in lowered:
        name = "Password File Access"
    elif "http request by ipv4" in lowered:
        name = "Direct IP HTTP Request"
    elif "union select" in lowered or "sql" in lowered:
        name = "SQL Injection Probe"
    elif "script tag" in lowered or "cross-site" in lowered or "xss" in lowered:
        name = "Cross-Site Scripting Attempt"
    elif "acunetix" in lowered:
        name = "Acunetix Scanner Probe"
    elif ".env" in lowered or "environment file" in lowered:
        name = "Environment File Disclosure"
    elif "wp-config" in lowered:
        name = "WordPress Config Disclosure"
    elif "jndi" in lowered or "log4shell" in lowered:
        name = "Log4Shell JNDI Probe"
    else:
        name = normalized

    return f"{severity.title()}: {name}"

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


class MonitoredWebsiteCreate(BaseModel):
    domain: str
    target_ip: str
    target_port: int
    scheme: str = "http"

    @field_validator('domain')
    @classmethod
    def normalize_domain(cls, v: str) -> str:
        return v.strip().lower().replace("https://", "").replace("http://", "").strip("/")

    @field_validator('scheme')
    @classmethod
    def validate_scheme(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in {"http", "https"}:
            raise ValueError("scheme must be http or https")
        return cleaned


class MonitoredWebsiteResponse(BaseModel):
    id: int
    domain: str
    target_ip: str
    target_port: int
    scheme: str
    is_active: bool
    created_at: datetime
    workspace_id: int
    proxy_url: str
    dns_target: str

    class Config:
        from_attributes = True
