from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Workspace(Base):
    """Represents a tenant (A Corporate Company or a Solo Student's environment)"""
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True) # e.g., "Acme Corp" or "STUDENT WORKSPACE"
    subscription_plan = Column(String, default="startup") # startup, enterprise
    api_key = Column(String, unique=True, index=True, nullable=True) # The Sensor Key belongs to the Workspace!
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("User", back_populates="workspace")
    alerts = relationship("Alert", back_populates="workspace")
    notifications = relationship("Notification", back_populates="workspace")

class User(Base):
    """Represents the actual human logging in"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    full_name = Column(String, nullable=True) # Filled during onboarding
    user_persona = Column(String, nullable=True) # student, solo_dev, corporate
    role = Column(String, default="admin") # admin (creator), analyst, viewer
    is_active = Column(Boolean, default=True)
    
    # Foreign Key connecting User to Workspace
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    
    # Notification Preferences
    alert_email = Column(String, nullable=True) 
    enable_email_notifications = Column(Boolean, default=True)
    min_severity_level = Column(String, default="high") # low, medium, high, critical
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    workspace = relationship("Workspace", back_populates="users")

class Alert(Base):
    """Represents a threat intercepted by the W-IDS sensor"""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    
    # Threat Classification
    type = Column(String, nullable=False) # SQLi, XSS, DDoS, Port Scan
    severity = Column(String, nullable=False) # low, medium, high, critical
    
    # Network Details
    source_ip = Column(String, nullable=False) # Attacker IP
    destination_ip = Column(String, nullable=False) # Target Server IP
    source_port = Column(Integer, nullable=True) 
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String, default="TCP") # TCP, UDP, ICMP, HTTP
    
    # W-IDS Specific Payload Data (CRITICAL FOR ANALYSIS)
    payload_preview = Column(Text, nullable=True) # E.g., "SELECT * FROM users WHERE..."
    
    # Status & Management
    action = Column(String, default="logged") # blocked, allowed, logged
    status = Column(String, default="new") # new, reviewing, reviewed, false_positive
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Data Isolation (Which workspace does this alert belong to?)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), index=True, nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="alerts")

class Notification(Base):
    """System and security notifications for the dashboard UI"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    type = Column(String, default="system") # system, security, success, warning
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Which workspace sees this notification?
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="notifications")