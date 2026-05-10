from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database import Base

class Workspace(Base):
    """Represents a tenant """
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True) # e.g., "Acme Corp" or "STUDENT WORKSPACE"
    api_key = Column(String, unique=True, index=True, nullable=True) # The Sensor Key belongs to the Workspace!
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("User", back_populates="workspace")
    alerts = relationship("Alert", back_populates="workspace")
    notifications = relationship("Notification", back_populates="workspace")
    blacklisted_ips = relationship("BlacklistedIP", back_populates="workspace")

class User(Base):
    """Represents the actual human logging in"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    full_name = Column(String, nullable=True) # Filled during onboarding
    user_persona = Column(String, nullable=True) 
    role = Column(String, default="admin") 
    
    is_active = Column(Boolean, default=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    
    # Notification Preferences
    alert_email = Column(String, nullable=True) 
    enable_email_notifications = Column(Boolean, default=True)
    min_severity_level = Column(String, default="high") 

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    workspace = relationship("Workspace", back_populates="users")

class Alert(Base):
    """The core intrusion event detected by the sensor"""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    # Threat Classification
    type = Column(String, nullable=False)
    severity = Column(String, nullable=False)

    # Network Details
    source_ip = Column(String, nullable=False)
    destination_ip = Column(String, nullable=False)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    protocol = Column(String, default="TCP")

    payload_preview = Column(Text, nullable=True)

    # Status & Management
    action = Column(String, default="logged")
    status = Column(String, default="new")
    notes = Column(Text, nullable=True)

    # ── ADD THESE TWO MISSING COLUMNS ──────────────
    is_flagged = Column(Boolean, default=False)   # analyst flagged for review
    is_saved = Column(Boolean, default=False)     # analyst saved for reference
    # ───────────────────────────────────────────────

    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), index=True, nullable=False)

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
    
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    # Relationships
    workspace = relationship("Workspace", back_populates="notifications")
class BlacklistedIP(Base):
    """IPs blocked directly by analysts or automated defense"""
    __tablename__ = "blacklisted_ips"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True, nullable=False)
    reason = Column(String, nullable=True)
    created_by = Column(Integer, nullable=True) # Which analyst blocked it
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), index=True, nullable=False)
    workspace = relationship("Workspace", back_populates="blacklisted_ips")

class MonitoredWebsite(Base):
    """Websites that are routed through the IDS reverse proxy"""
    __tablename__ = "monitored_websites"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, index=True, nullable=False) # e.g., example.com
    target_ip = Column(String, nullable=False) # e.g., 192.168.1.50
    target_port = Column(Integer, default=80, nullable=False) # e.g., 80, 443, 8080
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), index=True, nullable=False)
    # Relationships
    workspace = relationship("Workspace")