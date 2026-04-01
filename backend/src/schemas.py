from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional, List

class AlertBase(BaseModel):
    type: str
    severity: str
    source_ip: str
    owner_id: Optional[int] = None

class AlertCreate(AlertBase):
    pass

class AlertDisplay(AlertBase):
    id:int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str
    email: EmailStr
    password:str
    full_name: Optional[str] = None
    company_name: Optional[str] = None

class UserCreate(UserBase):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None

class UserDisplay(UserBase):
    id: int
    username:str
    email: str
    role: str
    full_name: Optional[str]
    company_name: Optional[str]
    is_active: bool

    model_config= ConfigDict(from_attributes=True)

class UserUpdate(UserBase):
    password: Optional[str] = None
    

class Token(BaseModel):
    acces_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None