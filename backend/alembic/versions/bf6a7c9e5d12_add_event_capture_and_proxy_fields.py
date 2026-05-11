"""add event capture and proxy fields

Revision ID: bf6a7c9e5d12
Revises: 9d61b98e4b21
Create Date: 2026-05-12 00:20:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "bf6a7c9e5d12"
down_revision: Union[str, Sequence[str], None] = "9d61b98e4b21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def add_column_if_missing(table_name: str, column: sa.Column) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {item["name"] for item in inspector.get_columns(table_name)}
    if column.name not in columns:
        op.add_column(table_name, column)


def upgrade() -> None:
    add_column_if_missing("alerts", sa.Column("event_id", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("capture_path", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("capture_mode", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("packet_filter", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("capture_window_seconds", sa.Integer(), nullable=True))

    add_column_if_missing("monitored_websites", sa.Column("public_hostname", sa.String(), nullable=True))
    add_column_if_missing("monitored_websites", sa.Column("listen_port", sa.Integer(), nullable=False, server_default="8080"))
    add_column_if_missing("monitored_websites", sa.Column("tls_mode", sa.String(), nullable=False, server_default="edge"))
    add_column_if_missing("monitored_websites", sa.Column("proxy_mode", sa.String(), nullable=False, server_default="reverse_proxy"))
    add_column_if_missing("monitored_websites", sa.Column("health_path", sa.String(), nullable=False, server_default="/"))

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("alerts")}
    if "ix_alerts_event_id" not in indexes:
        op.create_index("ix_alerts_event_id", "alerts", ["event_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_alerts_event_id", table_name="alerts")
    for column in ["health_path", "proxy_mode", "tls_mode", "listen_port", "public_hostname"]:
        op.drop_column("monitored_websites", column)
    for column in ["capture_window_seconds", "packet_filter", "capture_mode", "capture_path", "event_id"]:
        op.drop_column("alerts", column)
