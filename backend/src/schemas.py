from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional

class AlertCreate(BaseModel):
    type: str
    severity: str
    source_ip: str
    company_id: Optional[int] = None

class AlertDisplay(BaseModel):
    id: int
    type: str
    severity: str
    source_ip: str
    timestamp: datetime
    company_id: int
    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    company_name: str

class UserDisplay(BaseModel):
    id: int
    username: str
    email: str
    company_name: Optional[str] = None
    is_admin: bool
    role: str
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    password: Optional[str] = None