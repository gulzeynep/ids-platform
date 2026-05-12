"""repair runtime schema drift after proxy and signature migrations

Revision ID: e4f0a1b2c3d4
Revises: c2d4e6f8a901
Create Date: 2026-05-12 13:15:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4f0a1b2c3d4"
down_revision: Union[str, Sequence[str], None] = "c2d4e6f8a901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table_name)


def column_names(table_name: str) -> set[str]:
    if not table_exists(table_name):
        return set()
    return {column["name"] for column in sa.inspect(op.get_bind()).get_columns(table_name)}


def add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if column.name not in column_names(table_name):
        op.add_column(table_name, column)


def create_index_if_missing(table_name: str, index_name: str, columns: list[str], unique: bool = False) -> None:
    if not table_exists(table_name):
        return
    indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table_name)}
    if index_name not in indexes:
        op.create_index(index_name, table_name, columns, unique=unique)


def ensure_alerts_columns() -> None:
    add_column_if_missing("alerts", sa.Column("signature_msg", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("signature_class", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("signature_sid", sa.Integer(), nullable=True))
    add_column_if_missing("alerts", sa.Column("signature_gid", sa.Integer(), nullable=True))
    add_column_if_missing("alerts", sa.Column("event_id", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("capture_path", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("capture_mode", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("packet_filter", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("capture_window_seconds", sa.Integer(), nullable=True))
    add_column_if_missing("alerts", sa.Column("notes", sa.Text(), nullable=True))
    add_column_if_missing("alerts", sa.Column("is_flagged", sa.Boolean(), nullable=True, server_default=sa.text("false")))
    add_column_if_missing("alerts", sa.Column("is_saved", sa.Boolean(), nullable=True, server_default=sa.text("false")))

    op.execute("UPDATE alerts SET is_flagged = false WHERE is_flagged IS NULL")
    op.execute("UPDATE alerts SET is_saved = false WHERE is_saved IS NULL")
    create_index_if_missing("alerts", "ix_alerts_event_id", ["event_id"])


def ensure_monitored_websites_table() -> None:
    if not table_exists("monitored_websites"):
        op.create_table(
            "monitored_websites",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("domain", sa.String(), nullable=False),
            sa.Column("target_ip", sa.String(), nullable=False),
            sa.Column("target_port", sa.Integer(), nullable=False),
            sa.Column("scheme", sa.String(), nullable=False, server_default="http"),
            sa.Column("public_hostname", sa.String(), nullable=True),
            sa.Column("listen_port", sa.Integer(), nullable=False, server_default="80"),
            sa.Column("tls_mode", sa.String(), nullable=False, server_default="edge"),
            sa.Column("proxy_mode", sa.String(), nullable=False, server_default="reverse_proxy"),
            sa.Column("health_path", sa.String(), nullable=False, server_default="/"),
            sa.Column("is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    else:
        add_column_if_missing("monitored_websites", sa.Column("scheme", sa.String(), nullable=False, server_default="http"))
        add_column_if_missing("monitored_websites", sa.Column("public_hostname", sa.String(), nullable=True))
        add_column_if_missing("monitored_websites", sa.Column("listen_port", sa.Integer(), nullable=False, server_default="80"))
        add_column_if_missing("monitored_websites", sa.Column("tls_mode", sa.String(), nullable=False, server_default="edge"))
        add_column_if_missing("monitored_websites", sa.Column("proxy_mode", sa.String(), nullable=False, server_default="reverse_proxy"))
        add_column_if_missing("monitored_websites", sa.Column("health_path", sa.String(), nullable=False, server_default="/"))

    op.execute("UPDATE monitored_websites SET scheme = 'http' WHERE scheme IS NULL")
    op.execute("UPDATE monitored_websites SET listen_port = 80 WHERE listen_port IS NULL")
    op.execute("UPDATE monitored_websites SET tls_mode = 'edge' WHERE tls_mode IS NULL")
    op.execute("UPDATE monitored_websites SET proxy_mode = 'reverse_proxy' WHERE proxy_mode IS NULL")
    op.execute("UPDATE monitored_websites SET health_path = '/' WHERE health_path IS NULL")
    op.execute("UPDATE monitored_websites SET is_active = true WHERE is_active IS NULL")

    create_index_if_missing("monitored_websites", "ix_monitored_websites_id", ["id"])
    create_index_if_missing("monitored_websites", "ix_monitored_websites_domain", ["domain"])
    create_index_if_missing("monitored_websites", "ix_monitored_websites_workspace_id", ["workspace_id"])


def ensure_detection_rules_table() -> None:
    if not table_exists("detection_rules"):
        op.create_table(
            "detection_rules",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("severity", sa.String(), nullable=False, server_default="medium"),
            sa.Column("category", sa.String(), nullable=False, server_default="Web Custom"),
            sa.Column("match_type", sa.String(), nullable=False, server_default="contains"),
            sa.Column("pattern", sa.String(), nullable=False),
            sa.Column("enabled", sa.Boolean(), nullable=True, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    else:
        add_column_if_missing("detection_rules", sa.Column("title", sa.String(), nullable=False))
        add_column_if_missing("detection_rules", sa.Column("severity", sa.String(), nullable=False, server_default="medium"))
        add_column_if_missing("detection_rules", sa.Column("category", sa.String(), nullable=False, server_default="Web Custom"))
        add_column_if_missing("detection_rules", sa.Column("match_type", sa.String(), nullable=False, server_default="contains"))
        add_column_if_missing("detection_rules", sa.Column("pattern", sa.String(), nullable=False))
        add_column_if_missing("detection_rules", sa.Column("enabled", sa.Boolean(), nullable=True, server_default=sa.text("true")))
        add_column_if_missing("detection_rules", sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True))
        add_column_if_missing("detection_rules", sa.Column("workspace_id", sa.Integer(), nullable=False))

    create_index_if_missing("detection_rules", "ix_detection_rules_id", ["id"])
    create_index_if_missing("detection_rules", "ix_detection_rules_workspace_id", ["workspace_id"])


def upgrade() -> None:
    add_column_if_missing(
        "workspaces",
        sa.Column("detection_profile", sa.String(), nullable=False, server_default="web-balanced"),
    )
    op.execute("UPDATE workspaces SET detection_profile = 'web-balanced' WHERE detection_profile IS NULL")

    ensure_alerts_columns()
    ensure_monitored_websites_table()
    ensure_detection_rules_table()


def downgrade() -> None:
    # This revision intentionally repairs production/local drift without dropping data.
    pass
