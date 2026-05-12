import asyncio

from src.api.defense import sync_nginx_blacklist


class FakeResult:
    def all(self):
        return [("10.0.0.4",), ("203.0.113.9",)]


class FakeDb:
    async def execute(self, _query):
        return FakeResult()


def test_sync_nginx_blacklist_writes_nginx_deny_rules(tmp_path, monkeypatch):
    target = tmp_path / "blocked-ips.conf"
    monkeypatch.setattr("src.api.defense.BLACKLIST_CONFIG_PATH", target)

    asyncio.run(sync_nginx_blacklist(FakeDb()))

    content = target.read_text(encoding="utf-8")
    assert "deny 10.0.0.4;" in content
    assert "deny 203.0.113.9;" in content
    assert content.rstrip().endswith("allow all;")
