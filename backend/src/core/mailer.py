import os
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "senin_mailin@gmail.com"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "uygulama_sifren"),
    MAIL_FROM = "security@wids-core.io",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True
)

fastmail = FastMail(conf)

async def send_security_alert(email: str, alert_type: str, severity: str, source_ip: str):
    html = f"""
    <div style="background-color: #050505; color: white; padding: 20px; font-family: sans-serif; border-radius: 15px;">
        <h2 style="color: #ef4444;">🚨 CRITICAL SECURITY ALERT</h2>
        <p>A high-severity intrusion has been detected on your network.</p>
        <hr style="border: 0.5px solid #222;">
        <p><b>Type:</b> {alert_type}</p>
        <p><b>Severity:</b> <span style="color: #ef4444;">{severity.upper()}</span></p>
        <p><b>Source IP:</b> {source_ip}</p>
        <br>
        <a href="http://localhost:5173/intrusions" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Go to Dashboard</a>
    </div>
    """
    
    message = MessageSchema(
        subject=f"W-IDS ALERT: {severity.upper()} - {alert_type}",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    
    await fastmail.send_message(message)