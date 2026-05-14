import asyncio

from src.core import mailer


def test_smtp_ready_allows_smtp_user_as_from_fallback(monkeypatch):
    monkeypatch.setattr(mailer.settings, "SMTP_SERVER", "smtp.example.com")
    monkeypatch.setattr(mailer.settings, "SMTP_USER", "sender@example.com")
    monkeypatch.setattr(mailer.settings, "SMTP_PASS", "secret")
    monkeypatch.setattr(mailer.settings, "SMTP_FROM", None)

    assert mailer._smtp_ready()


def test_confirmation_email_builds_expected_message(monkeypatch):
    sent_messages = []

    class FakeMailer:
        async def send_message(self, message):
            sent_messages.append(message)

    monkeypatch.setattr(mailer, "_build_mailer", lambda: FakeMailer())
    monkeypatch.setattr(mailer.settings, "FRONTEND_URL", "http://localhost:5173")

    asyncio.run(mailer.send_confirmation_email("soc@example.com"))

    assert sent_messages[0].subject == "W-IDS Email Confirmation"
    assert sent_messages[0].recipients == ["soc@example.com"]
    assert "Email alert delivery is active" in sent_messages[0].body


def test_security_alert_email_includes_title_destination_and_timestamp(monkeypatch):
    sent_messages = []

    class FakeMailer:
        async def send_message(self, message):
            sent_messages.append(message)

    monkeypatch.setattr(mailer, "_build_mailer", lambda: FakeMailer())
    monkeypatch.setattr(mailer.settings, "FRONTEND_URL", "http://localhost:5173")

    asyncio.run(
        mailer.send_security_alert(
            "soc@example.com",
            "SQL Injection",
            "critical",
            "203.0.113.5",
            destination_ip="10.0.0.2",
            title="Critical: SQL Injection Probe",
        )
    )

    message = sent_messages[0]
    assert message.subject == "W-IDS ALERT: CRITICAL - Critical: SQL Injection Probe"
    assert "203.0.113.5" in message.body
    assert "10.0.0.2" in message.body


def test_should_send_alert_email_threshold():
    assert mailer.should_send_alert_email(
        enabled=True,
        recipient="soc@example.com",
        severity="high",
        min_severity_level="high",
    )
    assert not mailer.should_send_alert_email(
        enabled=True,
        recipient="soc@example.com",
        severity="medium",
        min_severity_level="high",
    )
    assert not mailer.should_send_alert_email(
        enabled=False,
        recipient="soc@example.com",
        severity="critical",
        min_severity_level="low",
    )
