from datetime import datetime, timezone
from types import SimpleNamespace

from src.schemas import build_alert_title, serialize_alert_contract


def test_signature_msg_wins_title_generation():
    assert (
        build_alert_title("critical", "[Generic]", "Fallback", "Critical: Shadow File Access")
        == "Critical: Shadow File Access"
    )


def test_serialize_alert_contract_includes_official_runtime_fields():
    alert = SimpleNamespace(
        id=7,
        type="Path Traversal",
        severity="high",
        source_ip="10.0.0.1",
        destination_ip="10.0.0.2",
        source_port=None,
        destination_port=80,
        protocol="TCP",
        action="logged",
        status="new",
        notes=None,
        payload_preview="[High: Password File Disclosure Attempt]",
        raw_request="GET /etc/passwd HTTP status=404",
        signature_msg="High: Password File Disclosure Attempt",
        signature_class="Path Traversal",
        signature_sid=9910000,
        signature_gid=1,
        event_id="evt-1",
        capture_path="/var/log/snort/event_captures/evt-1.json",
        capture_mode="event_metadata",
        packet_filter="tcp and host 10.0.0.1",
        capture_window_seconds=10,
        timestamp=datetime(2026, 5, 12, tzinfo=timezone.utc),
        workspace_id=3,
        is_flagged=False,
        is_saved=False,
    )

    payload = serialize_alert_contract(alert)

    assert payload["signature_msg"] == "High: Password File Disclosure Attempt"
    assert payload["event_id"] == "evt-1"
    assert payload["capture_mode"] == "event_metadata"
    assert payload["raw_request"] == "GET /etc/passwd HTTP status=404"
