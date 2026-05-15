from pydantic import BaseModel, EmailStr, computed_field, field_validator
from typing import Any, Optional
from datetime import datetime
import ipaddress
import re

# Auth and User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "analyst"

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
    name: Optional[str]
    subscription_plan: Optional[str] = None
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
    raw_request: Optional[str] = None
    signature_msg: Optional[str] = None
    signature_class: Optional[str] = None
    signature_sid: Optional[int] = None
    signature_gid: Optional[int] = None
    event_id: Optional[str] = None
    capture_path: Optional[str] = None
    capture_mode: Optional[str] = None
    packet_filter: Optional[str] = None
    capture_window_seconds: Optional[int] = None

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
    raw_request: Optional[str] = None
    signature_msg: Optional[str] = None
    signature_class: Optional[str] = None
    signature_sid: Optional[int] = None
    signature_gid: Optional[int] = None
    event_id: Optional[str] = None
    capture_path: Optional[str] = None
    capture_mode: Optional[str] = None
    packet_filter: Optional[str] = None
    capture_window_seconds: Optional[int] = None
    
    is_flagged: bool = False
    is_saved: bool = False
    
    timestamp: datetime
    workspace_id: int

    @computed_field
    @property
    def display_title(self) -> str:
        return build_alert_title(self.severity, self.payload_preview, self.type, self.signature_msg)

    class Config:
        from_attributes = True


def build_alert_title(
    severity: str,
    payload_preview: Optional[str],
    fallback: str,
    signature_msg: Optional[str] = None,
) -> str:
    severity_title = severity.title()

    if signature_msg:
        cleaned_signature = signature_msg.strip()
        if re.match(r"^(critical|high|medium|low)\s*:", cleaned_signature, re.IGNORECASE):
            return cleaned_signature
        return f"{severity_title}: {cleaned_signature}"

    if not payload_preview:
        return f"{severity_title}: {fallback}"

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

    return f"{severity_title}: {name}"


def serialize_alert_contract(alert: Any) -> dict:
    """Canonical alert payload used by REST responses and WebSocket events."""
    return {
        "id": alert.id,
        "type": alert.type,
        "title": build_alert_title(alert.severity, alert.payload_preview, alert.type, alert.signature_msg),
        "severity": alert.severity,
        "source_ip": alert.source_ip,
        "destination_ip": alert.destination_ip,
        "source_port": alert.source_port,
        "destination_port": alert.destination_port,
        "protocol": alert.protocol,
        "action": alert.action,
        "status": alert.status,
        "notes": alert.notes,
        "payload_preview": alert.payload_preview,
        "raw_request": alert.raw_request,
        "signature_msg": alert.signature_msg,
        "signature_class": alert.signature_class,
        "signature_sid": alert.signature_sid,
        "signature_gid": alert.signature_gid,
        "event_id": alert.event_id,
        "capture_path": alert.capture_path,
        "capture_mode": alert.capture_mode,
        "packet_filter": alert.packet_filter,
        "capture_window_seconds": alert.capture_window_seconds,
        "timestamp": alert.timestamp.isoformat() if hasattr(alert.timestamp, "isoformat") else alert.timestamp,
        "workspace_id": alert.workspace_id,
        "is_flagged": bool(alert.is_flagged),
        "is_saved": bool(alert.is_saved),
    }

class AlertUpdateStatus(BaseModel):
    """Used by Analysts to update the status of an alert"""
    status: Optional[str] = None
    notes: Optional[str] = None
    is_flagged: Optional[bool] = None
    is_saved: Optional[bool] = None 

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip().lower()
        allowed = {"new", "reviewing", "reviewed", "false_positive"}
        if cleaned not in allowed:
            raise ValueError(f"Status must be one of {sorted(allowed)}")
        return cleaned


class UserSettingsUpdate(BaseModel):
    alert_email: Optional[EmailStr] = None
    enable_email_notifications: Optional[bool] = None
    min_severity_level: Optional[str] = None

    @field_validator("min_severity_level")
    @classmethod
    def validate_min_severity_level(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip().lower()
        allowed = {"low", "medium", "high", "critical"}
        if cleaned not in allowed:
            raise ValueError(f"Minimum severity must be one of {sorted(allowed)}")
        return cleaned


class UserSettingsResponse(BaseModel):
    alert_email: Optional[str] = None
    enable_email_notifications: bool = True
    min_severity_level: str = "high"

# Defense and Blacklist Schemas
def normalize_blacklist_address(value: str) -> str:
    cleaned = value.strip()
    try:
        if "/" in cleaned:
            return str(ipaddress.ip_network(cleaned, strict=False))
        return str(ipaddress.ip_address(cleaned))
    except ValueError as exc:
        raise ValueError("Blacklist target must be a valid IPv4, IPv6, or CIDR range.") from exc


class BlacklistCreate(BaseModel):
    ip_address: str
    reason: Optional[str] = "Malicious activity detected by analyst"

    @field_validator("ip_address")
    @classmethod
    def normalize_ip_address(cls, value: str) -> str:
        return normalize_blacklist_address(value)

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
    public_hostname: Optional[str] = None
    listen_port: int = 80
    tls_mode: str = "edge"
    proxy_mode: str = "reverse_proxy"
    health_path: str = "/"

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

    @field_validator('listen_port', 'target_port')
    @classmethod
    def validate_port(cls, v: int) -> int:
        if v < 1 or v > 65535:
            raise ValueError("port must be between 1 and 65535")
        return v

    @field_validator('tls_mode')
    @classmethod
    def validate_tls_mode(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in {"edge", "passthrough", "origin"}:
            raise ValueError("tls_mode must be edge, passthrough, or origin")
        return cleaned


class MonitoredWebsiteUpdate(BaseModel):
    domain: Optional[str] = None
    target_ip: Optional[str] = None
    target_port: Optional[int] = None
    scheme: Optional[str] = None
    public_hostname: Optional[str] = None
    listen_port: Optional[int] = None
    tls_mode: Optional[str] = None
    proxy_mode: Optional[str] = None
    health_path: Optional[str] = None
    is_active: Optional[bool] = None


class MonitoredWebsiteResponse(BaseModel):
    id: int
    domain: str
    target_ip: str
    target_port: int
    scheme: str
    public_hostname: Optional[str]
    listen_port: int
    tls_mode: str
    proxy_mode: str
    health_path: str
    is_active: bool
    created_at: datetime
    workspace_id: int
    proxy_url: str
    dns_target: str
    nginx_server_block: str
    tls_status: str
    upstream_health: str

    class Config:
        from_attributes = True


class DetectionRuleBase(BaseModel):
    title: str
    severity: str = "medium"
    category: str = "Web Custom"
    match_type: str = "contains"
    pattern: str
    enabled: bool = True

    @field_validator('title', 'category', 'pattern')
    @classmethod
    def trim_required_text(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("value cannot be empty")
        return cleaned

    @field_validator('severity')
    @classmethod
    def validate_rule_severity(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in {"low", "medium", "high", "critical"}:
            raise ValueError("severity must be low, medium, high, or critical")
        return cleaned

    @field_validator('match_type')
    @classmethod
    def validate_match_type(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in {"contains", "regex", "snort"}:
            raise ValueError("match_type must be contains, regex, or snort")
        return cleaned


class DetectionRuleCreate(DetectionRuleBase):
    pass


class DetectionRuleUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    category: Optional[str] = None
    match_type: Optional[str] = None
    pattern: Optional[str] = None
    enabled: Optional[bool] = None


class DetectionRuleResponse(DetectionRuleBase):
    id: int
    created_at: datetime
    workspace_id: int

    class Config:
        from_attributes = True


class DetectionProfileUpdate(BaseModel):
    profile: str

    @field_validator('profile')
    @classmethod
    def validate_profile(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in {"web-official", "web-balanced", "web-full", "local-only"}:
            raise ValueError("profile must be web-official, web-balanced, web-full, or local-only")
        return cleaned


class DetectionProfileResponse(BaseModel):
    profile: str
    available_profiles: list[str]
    engine_profile: Optional[str] = None
    reload_requested: bool = False


class SensorKeyResponse(BaseModel):
    api_key: str
    workspace_id: int
    delivery: str = "shared_file"
    key_file: str
    rotate_requires_bridge_restart: bool = False
