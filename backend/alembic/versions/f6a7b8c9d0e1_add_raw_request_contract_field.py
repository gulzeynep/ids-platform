"""add raw request field to alert contract

Revision ID: f6a7b8c9d0e1
Revises: e4f0a1b2c3d4
Create Date: 2026-05-12 14:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "e4f0a1b2c3d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def add_column_if_missing(table_name: str, column: sa.Column) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {item["name"] for item in inspector.get_columns(table_name)}
    if column.name not in columns:
        op.add_column(table_name, column)


def upgrade() -> None:
    add_column_if_missing("alerts", sa.Column("raw_request", sa.Text(), nullable=True))
    op.alter_column("monitored_websites", "listen_port", server_default="80")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {item["name"] for item in inspector.get_columns("alerts")}
    if "raw_request" in columns:
        op.drop_column("alerts", "raw_request")
    if inspector.has_table("monitored_websites"):
        op.alter_column("monitored_websites", "listen_port", server_default="8080")
