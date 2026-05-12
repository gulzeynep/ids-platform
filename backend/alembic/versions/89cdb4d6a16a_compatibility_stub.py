"""compatibility marker for existing local databases

Revision ID: 89cdb4d6a16a
Revises: bf6a7c9e5d12
Create Date: 2026-05-12 14:10:00.000000
"""
from typing import Sequence, Union


revision: str = "89cdb4d6a16a"
down_revision: Union[str, Sequence[str], None] = "bf6a7c9e5d12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
