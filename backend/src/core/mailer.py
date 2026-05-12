from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from config import settings


def _smtp_ready() -> bool:
    return bool(settings.SMTP_SERVER and settings.SMTP_USER and settings.SMTP_PASS and settings.SMTP_FROM)


def _build_mailer() -> FastMail:
    if not _smtp_ready():
        raise HTTPException(status_code=400, detail="SMTP settings are incomplete.")

    conf = ConnectionConfig(
        MAIL_USERNAME=settings.SMTP_USER,
        MAIL_PASSWORD=settings.SMTP_PASS,
        MAIL_FROM=settings.SMTP_FROM,
        MAIL_PORT=settings.SMTP_PORT,
        MAIL_SERVER=settings.SMTP_SERVER,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
    )
    return FastMail(conf)


def should_send_alert_email(
    *,
    enabled: bool,
    recipient: Optional[str],
    severity: str,
    min_severity_level: str,
) -> bool:
    severity_rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    return (
        enabled
        and bool(recipient)
        and severity_rank.get(severity.lower(), 0) >= severity_rank.get(min_severity_level.lower(), 3)
    )

async def send_security_alert(email: str, alert_type: str, severity: str, source_ip: str):
    frontend_url = settings.FRONTEND_URL
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    html_content = f"""
    <div style="background-color:#050505; color:#ffffff; padding:40px; font-family:sans-serif; border-radius:30px; border:1px solid #1a1a1a;">
        <h1 style="color:#3b82f6; margin-bottom:5px; font-style:italic">W-IDS COMMAND CENTER</h1>
        <hr style="border:0; border-top:1px solid #333; margin:20px 0;">
        <h2 style="color:#ef4444;">SECURITY BREACH IDENTIFIED</h2>
        <p style="color:#888;">An automated response has been triggered for the following event:</p>
        
        <div style="background:#0a0a0a; padding:25px; border-radius:20px; border:1px solid #ef444433; margin:20px 0;">
            <p><b>Event Type:</b> <span style="color:#3b82f6;">{alert_type}</span></p>
            <p><b>Attacker IP:</b> <span style="font-family:monospace; color:#ef4444;">{source_ip}</span></p>
            <p><b>Priority:</b> <span style="background:#ef4444; color:white; padding:2px 8px; border-radius:4px;">{severity.upper()}</span></p>
        </div>
        
        <p style="font-size:11px; color:#444;">Timestamp: {current_time}</p>
        <a href="{frontend_url}/intrusions" style="display:inline-block; margin-top:20px; background:#ffffff; color:#000000; padding:15px 30px; text-decoration:none; border-radius:15px; font-weight:bold; font-size:12px; text-transform:uppercase;">View Live Analysis</a>
    </div>
    """
    
    message = MessageSchema(
        subject=f"W-IDS ALERT: {severity.upper()} - {alert_type}",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html
    )
    
    await _build_mailer().send_message(message)


async def send_confirmation_email(email: str):
    frontend_url = settings.FRONTEND_URL
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    html_content = f"""
    <div style="background-color:#050505; color:#ffffff; padding:32px; font-family:sans-serif; border-radius:18px; border:1px solid #1f2937;">
        <h1 style="color:#3b82f6; margin:0 0 12px;">W-IDS Email Confirmation</h1>
        <p style="color:#d4d4d4;">Email alert delivery is active for this mailbox.</p>
        <p style="color:#888; font-size:12px;">Sent at {current_time}</p>
        <a href="{frontend_url}/settings" style="display:inline-block; margin-top:16px; background:#2563eb; color:#ffffff; padding:12px 18px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:12px;">Open Settings</a>
    </div>
    """

    message = MessageSchema(
        subject="W-IDS Email Confirmation",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html,
    )

    await _build_mailer().send_message(message)
