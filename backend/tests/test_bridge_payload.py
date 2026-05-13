import base64
import struct

import snort_bridge


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


def test_extract_raw_request_from_pcap_filters_by_tcp_ports(tmp_path):
    def packet(src_port: int, dst_port: int, payload: bytes) -> bytes:
        ethernet = b"\x00" * 12 + b"\x08\x00"
        ipv4 = bytearray(20)
        ipv4[0] = 0x45
        ipv4[2:4] = (20 + 20 + len(payload)).to_bytes(2, "big")
        ipv4[8] = 64
        ipv4[9] = 6
        tcp = bytearray(20)
        tcp[0:2] = src_port.to_bytes(2, "big")
        tcp[2:4] = dst_port.to_bytes(2, "big")
        tcp[12] = 0x50
        return ethernet + bytes(ipv4) + bytes(tcp) + payload

    pcap_path = tmp_path / "ring.pcap"
    first = packet(45022, 80, b"GET /wwwboard/passwd.txt HTTP/1.1\r\nHost: app.test\r\n\r\n")
    second = packet(45028, 80, b"GET /search?id=1%20union%20select%201 HTTP/1.1\r\nHost: app.test\r\n\r\n")
    pcap_path.write_bytes(
        struct.pack("<IHHIIII", 0xA1B2C3D4, 2, 4, 0, 0, 65535, 1)
        + struct.pack("<IIII", 1, 0, len(first), len(first))
        + first
        + struct.pack("<IIII", 2, 0, len(second), len(second))
        + second
    )

    assert snort_bridge.extract_raw_request_from_pcap(pcap_path, src_port=45028, dst_port=80).startswith(
        "GET /search?id=1%20union%20select%201 HTTP/1.1"
    )
