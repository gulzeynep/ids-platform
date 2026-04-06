from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

# --- USER VE COMPANY KISIMLARI AYNI KALIYOR ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    company_name: str
    full_name: Optional[str] = None

    @field_validator('email', 'username')
    @classmethod
    def trim_and_lower(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator('company_name', 'full_name')
    @classmethod
    def trim_spaces(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip()
        return v

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_admin: bool
    company_name: Optional[str] = None

    class Config:
        from_attributes = True

class CompanyCreate(BaseModel):
    name: str
    subscription_plan: Optional[str] = "free"

class CompanyResponse(BaseModel):
    id: int
    name: str
    subscription_plan: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- ALERT (ALARM) ŞEMALARI (YENİLENDİ) ---
class AlertCreate(BaseModel):
    type: str
    severity: str
    source_ip: str
    destination_ip: str
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    protocol: str = "TCP"
    action: str = "logged"

    @field_validator('type', 'source_ip', 'destination_ip', 'protocol', 'action')
    @classmethod
    def trim_spaces(cls, v: str) -> str:
        return v.strip()

    @field_validator('severity')
    @classmethod
    def validate_and_format_severity(cls, v: str) -> str:
        cleaned = v.strip().lower()
        allowed_severities = ['low', 'medium', 'high', 'critical']
        if cleaned not in allowed_severities:
            raise ValueError(f"Severity must be one of {allowed_severities}")
        return cleaned

    # VİP KORUMA: Port numaraları geçerli bir aralıkta mı?
    @field_validator('source_port', 'destination_port')
    @classmethod
    def validate_ports(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 0 or v > 65535):
            raise ValueError("Port number must be between 0 and 65535")
        return v

class AlertResponse(BaseModel):
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
    timestamp: datetime
    company_id: int
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- İNCELEME GÜNCELLEMESİ İÇİN YENİ ŞEMA ---
# Bir analist alarmı "İncelendi" olarak işaretlediğinde kullanılacak
class AlertUpdateStatus(BaseModel):
    status: str # reviewing, reviewed, false_positive
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        cleaned = v.strip().lower()
        allowed = ['new', 'reviewing', 'reviewed', 'false_positive']
        if cleaned not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return cleaned