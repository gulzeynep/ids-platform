import asyncio
from types import SimpleNamespace

from src.api import auth
from src.schemas import UserRegister


class EmptyScalars:
    def first(self):
        return None


class EmptyResult:
    def scalars(self):
        return EmptyScalars()


class FakeDb:
    def __init__(self):
        self.added = []
        self.commits = 0

    async def execute(self, _query):
        return EmptyResult()

    def add(self, item):
        self.added.append(item)

    async def commit(self):
        self.commits += 1


def test_register_keeps_user_when_registration_email_fails(monkeypatch):
    db = FakeDb()

    async def fake_workspace(_db):
        return SimpleNamespace(id=12)

    async def failing_registration_email(_email):
        raise RuntimeError("smtp unavailable")

    monkeypatch.setattr(auth, "get_or_create_sensor_workspace", fake_workspace)
    monkeypatch.setattr(auth, "send_registration_email", failing_registration_email)

    result = asyncio.run(
        auth.register_user(
            UserRegister(email="Analyst@Example.com", password="ValidPass1!"),
            db=db,
        )
    )

    assert result == {"message": "Success", "email_confirmation_sent": False}
    assert db.commits == 1
    assert db.added[0].email == "analyst@example.com"
