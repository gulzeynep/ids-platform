import asyncio

import pytest
from pydantic import ValidationError

from src.api.defense import sync_nginx_blacklist
from src.schemas import BlacklistCreate


class FakeResult:
    def all(self):
        return [("203.0.113.9",), ("10.0.0.4",), ("10.0.0.4",)]


class FakeDb:
    async def execute(self, _query):
        return FakeResult()


def test_sync_nginx_blacklist_writes_nginx_deny_rules(tmp_path, monkeypatch):
    target = tmp_path / "blocked-ips.conf"
    monkeypatch.setattr("src.api.defense.BLACKLIST_CONFIG_PATH", target)

    asyncio.run(sync_nginx_blacklist(FakeDb()))

    content = target.read_text(encoding="utf-8")
    assert content.splitlines()[-3:] == [
        "deny 10.0.0.4;",
        "deny 203.0.113.9;",
        "allow all;",
    ]


def test_blacklist_create_normalizes_ip_and_cidr_targets():
    assert BlacklistCreate(ip_address=" 192.168.1.1 ").ip_address == "192.168.1.1"
    assert BlacklistCreate(ip_address="203.0.113.5/24").ip_address == "203.0.113.0/24"
    assert BlacklistCreate(ip_address="2001:db8::1").ip_address == "2001:db8::1"


def test_blacklist_create_rejects_invalid_ip_targets():
    with pytest.raises(ValidationError):
        BlacklistCreate(ip_address="not-an-ip")
