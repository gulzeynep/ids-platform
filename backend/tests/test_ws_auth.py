import asyncio

from src.api import ws


class FakeWebSocket:
    def __init__(self):
        self.close_code = None
        self.close_reason = None

    async def close(self, code=None, reason=None):
        self.close_code = code
        self.close_reason = reason


def test_close_policy_violation_logs_reason(monkeypatch):
    websocket = FakeWebSocket()
    log_messages = []

    def fake_warning(message, reason):
        log_messages.append((message, reason))

    monkeypatch.setattr(ws.logger, "warning", fake_warning)

    asyncio.run(ws.close_policy_violation(websocket, "invalid_token"))

    assert websocket.close_code == ws.WS_POLICY_VIOLATION
    assert websocket.close_reason == "invalid_token"
    assert log_messages == [("WebSocket authentication failed: %s", "invalid_token")]
