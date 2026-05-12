import base64
import struct

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


def test_snort_payload_extracts_raw_request_from_b64_data(tmp_path, monkeypatch):
    monkeypatch.setattr(snort_bridge, "CAPTURE_DIR", tmp_path)

    http_payload = b"GET /admin?debug=true HTTP/1.1\r\nHost: victim.test\r\nUser-Agent: curl/8\r\n\r\n"
    payload = snort_bridge.build_payload(
        {
            "seconds": 1,
            "msg": "High: Direct HTTP Probe",
            "priority": 2,
            "class": "Web Probe",
            "src_ap": "10.0.0.5:53122",
            "dst_ap": "10.0.0.10:80",
            "proto": "TCP",
            "sid": 100001,
            "gid": 1,
            "b64_data": base64.b64encode(http_payload).decode("ascii"),
        }
    )

    assert payload["raw_request"] == "GET /admin?debug=true HTTP/1.1\nHost: victim.test\nUser-Agent: curl/8"


def test_extract_raw_request_from_pcap(tmp_path):
    pcap_path = tmp_path / "event.pcap"
    packet = b"\x00" * 54 + b"POST /login HTTP/1.1\r\nHost: app.test\r\nContent-Length: 0\r\n\r\n"
    pcap_path.write_bytes(
        struct.pack("<IHHIIII", 0xA1B2C3D4, 2, 4, 0, 0, 65535, 1)
        + struct.pack("<IIII", 1, 0, len(packet), len(packet))
        + packet
    )

    assert (
        snort_bridge.extract_raw_request_from_pcap(pcap_path)
        == "POST /login HTTP/1.1\nHost: app.test\nContent-Length: 0"
    )
