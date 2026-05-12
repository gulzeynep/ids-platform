import snort_bridge


def test_nginx_access_payload_contains_official_alert_contract_fields(tmp_path, monkeypatch):
    monkeypatch.setattr(snort_bridge, "CAPTURE_DIR", tmp_path)

    payload = snort_bridge.build_access_payload(
        '172.18.0.1 - - [12/May/2026:14:00:00 +0000] "GET /etc/passwd HTTP/1.1" 404 335 "-" "curl/8" "-"'
    )

    assert payload is not None
    assert payload["signature_msg"] == "High: Password File Disclosure Attempt"
    assert payload["signature_class"] == "Path Traversal"
    assert payload["signature_sid"] == 9910000
    assert payload["event_id"]
    assert payload["capture_path"].startswith(str(tmp_path))
    assert payload["raw_request"] == "GET /etc/passwd HTTP status=404"
