import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace

from src import worker


def build_alert(severity="high"):
    return SimpleNamespace(
        type="SQL Injection",
        severity=severity,
        source_ip="203.0.113.5",
        destination_ip="10.0.0.2",
        payload_preview="[SQL Injection]",
        signature_msg="High: SQL Injection Probe",
        timestamp=datetime(2026, 5, 14, tzinfo=timezone.utc),
    )


def build_user(min_severity_level="high", enabled=True):
    return SimpleNamespace(
        id=7,
        email="analyst@example.com",
        alert_email="soc@example.com",
        enable_email_notifications=enabled,
        min_severity_level=min_severity_level,
    )


def test_worker_delivers_high_severity_alert_email(monkeypatch):
    deliveries = []

    async def fake_send_security_alert(*args, **kwargs):
        deliveries.append((args, kwargs))

    monkeypatch.setattr(worker, "send_security_alert", fake_send_security_alert)

    asyncio.run(worker.deliver_alert_emails(build_alert("high"), [build_user("high")]))

    args, kwargs = deliveries[0]
    assert args[:4] == ("soc@example.com", "SQL Injection", "high", "203.0.113.5")
    assert kwargs["destination_ip"] == "10.0.0.2"
    assert kwargs["title"] == "High: SQL Injection Probe"


def test_worker_skips_alert_email_below_threshold(monkeypatch):
    deliveries = []

    async def fake_send_security_alert(*args, **kwargs):
        deliveries.append((args, kwargs))

    monkeypatch.setattr(worker, "send_security_alert", fake_send_security_alert)

    asyncio.run(worker.deliver_alert_emails(build_alert("medium"), [build_user("high")]))

    assert deliveries == []
