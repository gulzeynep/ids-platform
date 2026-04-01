from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    subscription_plan = Column(String, default="free") # free, pro, enterprise
    created_at = Column(DateTime, default=datetime.utcnow)

    # İlişkiler: Bir şirketin birçok kullanıcısı ve alarmı olabilir
    users = relationship("User", back_populates="company")
    alerts = relationship("Alert", back_populates="company")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Şirket İlişkisi
    company_id = Column(Integer, ForeignKey("companies.id"))
    company = relationship("Company", back_populates="users")

    api_key = Column(String, unique=True, index=True, nullable=True)
    is_admin = Column(Boolean, default=False)
    role = Column(String, default="analyst") # admin, analyst, developer
    full_name = Column(String, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # SQL Injection, Brute Force vb.
    severity = Column(String) # Low, Medium, High, Critical
    source_ip = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Şirket İlişkisi: Alarmın kime ait olduğunu belirleyen ana sütun
    company_id = Column(Integer, ForeignKey("companies.id"), index=True)
    company = relationship("Company", back_populates="alerts")
    
    # Opsiyonel: Alarmı inceleyen kullanıcı
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)