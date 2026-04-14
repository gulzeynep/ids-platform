import os
from datetime import datetime
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("SMTP_USER", "security@wids-core.io"),
    MAIL_PASSWORD = os.getenv("SMTP_PASS", "password"),
    MAIL_FROM = "security@wids-core.io",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True
)

fastmail = FastMail(conf)

async def send_security_alert(email: str, alert_type: str, severity: str, source_ip: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
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
    
    await fastmail.send_message(message)