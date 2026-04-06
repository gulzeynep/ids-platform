import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

async def send_security_alert(to_email, alert_type, source_ip, severity):
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    if not smtp_user or not smtp_pass:
        print("❌ ERROR: SMTP Credentials missing in .env file!")
        return

    msg = MIMEMultipart()
    msg['From'] = f"W-IDS SOC ALERT <{smtp_user}>"
    msg['To'] = to_email
    msg['Subject'] = f"🚨 {severity.upper()} INTRUSION DETECTED"

    # Profesyonel HTML Şablonu
    html = f"""
    <div style="background-color:#050505; color:#ffffff; padding:40px; font-family:sans-serif; border-radius:30px; border:1px solid #1a1a1a;">
        <h1 style="color:#3b82f6; margin-bottom:5px; italic">W-IDS COMMAND CENTER</h1>
        <hr style="border:0; border-top:1px solid #333; margin:20px 0;">
        <h2 style="color:#ef4444;">SECURITY BREACH IDENTIFIED</h2>
        <p style="color:#888;">An automated response has been triggered for the following event:</p>
        
        <div style="background:#0a0a0a; padding:25px; border-radius:20px; border:1px solid #ef444433; margin:20px 0;">
            <p><b>Event Type:</b> <span style="color:#3b82f6;">{alert_type}</span></p>
            <p><b>Attacker IP:</b> <span style="font-family:monospace; color:#ef4444;">{source_ip}</span></p>
            <p><b>Priority:</b> <span style="background:#ef4444; color:white; padding:2px 8px; border-radius:4px;">{severity}</span></p>
        </div>
        
        <p style="font-size:11px; color:#444;">Timestamp: {current_time_str}</p>
        <a href="http://localhost:5173/overview" style="display:inline-block; margin-top:20px; background:#ffffff; color:#000000; padding:15px 30px; text-decoration:none; border-radius:15px; font-weight:bold; font-size:12px; text-transform:uppercase;">View Live Analysis</a>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            print(f"✅ Alert dispatched to {to_email}")
    except Exception as e:
        print(f"❌ SMTP DISPATCH FAILED: {e}")