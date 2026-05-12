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
    detection_profile = Column(String, default="web-balanced", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("User", back_populates="workspace")
    alerts = relationship("Alert", back_populates="workspace")
    notifications = relationship("Notification", back_populates="workspace")
    blacklisted_ips = relationship("BlacklistedIP", back_populates="workspace")
    monitored_websites = relationship("MonitoredWebsite", back_populates="workspace")
    detection_rules = relationship("DetectionRule", back_populates="workspace")

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
    protocol = Column(String, default="TCP") # TCP, UDP, ICMP, HTTP
    
    payload_preview = Column(Text, nullable=True) 
    raw_request = Column(Text, nullable=True)
    signature_msg = Column(String, nullable=True)
    signature_class = Column(String, nullable=True)
    signature_sid = Column(Integer, nullable=True)
    signature_gid = Column(Integer, nullable=True)
    event_id = Column(String, nullable=True, index=True)
    capture_path = Column(String, nullable=True)
    capture_mode = Column(String, nullable=True)
    packet_filter = Column(String, nullable=True)
    capture_window_seconds = Column(Integer, nullable=True)
    
    # Status & Management
    action = Column(String, default="logged") # blocked, allowed, logged
    status = Column(String, default="new") # reviewing, reviewed, false_positive
    notes = Column(Text, nullable=True) 
    is_flagged = Column(Boolean, default=False)
    is_saved = Column(Boolean, default=False)

    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    # Data Isolation 
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
    """A customer origin protected by the W-IDS reverse proxy."""
    __tablename__ = "monitored_websites"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, index=True, nullable=False)
    target_ip = Column(String, nullable=False)
    target_port = Column(Integer, nullable=False)
    scheme = Column(String, default="http", nullable=False)
    public_hostname = Column(String, nullable=True)
    listen_port = Column(Integer, default=80, nullable=False)
    tls_mode = Column(String, default="edge", nullable=False)
    proxy_mode = Column(String, default="reverse_proxy", nullable=False)
    health_path = Column(String, default="/", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), index=True, nullable=False)

    workspace = relationship("Workspace", back_populates="monitored_websites")


class DetectionRule(Base):
    """Workspace-owned HTTP fallback signature used by the reverse-proxy bridge."""
    __tablename__ = "detection_rules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    severity = Column(String, default="medium", nullable=False)
    category = Column(String, default="Web Custom", nullable=False)
    match_type = Column(String, default="contains", nullable=False)
    pattern = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), index=True, nullable=False)

    workspace = relationship("Workspace", back_populates="detection_rules")
