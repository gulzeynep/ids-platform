from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from backend.src.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    subscription_plan = Column(String, default="free")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    full_name = Column(String, nullable=True)
    role = Column(String, default="analyst") # admin, analyst, viewer
    is_active = Column(Boolean, default=True)
    
    api_key = Column(String, unique=True, index=True)
    is_admin = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"))

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    
    # TEHDİT SINIFLANDIRMASI (Classification)
    type = Column(String, nullable=False) # Örn: SQL Injection, Port Scan
    severity = Column(String, nullable=False) # low, medium, high, critical
    
    # AĞ BAĞLANTISI BİLGİLERİ (Network Details - YENİ)
    source_ip = Column(String, nullable=False) # Saldırgan IP (Initiator)
    destination_ip = Column(String, nullable=False) # Hedef Sunucu IP (Responder)
    source_port = Column(Integer, nullable=True) 
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String, default="TCP") # TCP, UDP, ICMP, HTTP
    
    # AKSİYON VE DURUM (Management - YENİ)
    action = Column(String, default="logged") # blocked, allowed, logged
    status = Column(String, default="new") # new, reviewing, reviewed, false_positive
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # İLİŞKİLER
    company_id = Column(Integer, ForeignKey("companies.id"), index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True) # İnceleyen Analist (Assignee)