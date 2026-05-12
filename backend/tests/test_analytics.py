from src.analytics import build_success_metrics, ratio, with_share
from src.core.mailer import should_send_alert_email
from src.schemas import AlertUpdateStatus
from sensor_simulator import build_alert_payload


def test_ratio_handles_empty_denominator():
    assert ratio(5, 0) == 0.0


def test_with_share_adds_distribution_ratios():
    items = with_share(
        [
            {"type": "SQL Injection", "count": 3},
            {"type": "XSS", "count": 1},
        ],
        4,
    )

    assert items[0]["ratio"] == 0.75
    assert items[1]["ratio"] == 0.25


def test_success_metrics_calculate_triage_and_backlog_rates():
    metrics = build_success_metrics(
        total_alerts=10,
        reviewed_alerts=4,
        false_positive_alerts=1,
        active_alerts=5,
        blocked_alerts=2,
        flagged_alerts=3,
        critical_alerts=2,
        resolved_critical_alerts=1,
    )

    assert metrics["triaged_alerts"] == 5
    assert metrics["resolution_rate"] == 0.5
    assert metrics["backlog_rate"] == 0.5
    assert metrics["containment_rate"] == 0.2
    assert metrics["critical_resolution_rate"] == 0.5
    assert metrics["formulas"]["resolution_rate"] == "(reviewed + false_positive) / total_alerts"


def test_alert_status_accepts_unreviewed_state():
    payload = AlertUpdateStatus(status="new")
    assert payload.status == "new"


def test_email_severity_threshold_check():
    assert should_send_alert_email(
        enabled=True,
        recipient="soc@example.com",
        severity="critical",
        min_severity_level="high",
    )
    assert not should_send_alert_email(
        enabled=True,
        recipient="soc@example.com",
        severity="medium",
        min_severity_level="high",
    )


def test_sensor_simulator_builds_ingest_contract_payload():
    payload = build_alert_payload()

    assert payload["type"]
    assert payload["severity"] in {"low", "medium", "high", "critical"}
    assert payload["source_ip"].count(".") == 3
    assert payload["destination_ip"]
    assert payload["action"] in {"logged", "blocked"}
