"""add signature, proxy, and detection rule runtime fields

Revision ID: c2d4e6f8a901
Revises: bf6a7c9e5d12
Create Date: 2026-05-12 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2d4e6f8a901"
down_revision: Union[str, Sequence[str], None] = "bf6a7c9e5d12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def add_column_if_missing(table_name: str, column: sa.Column) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {item["name"] for item in inspector.get_columns(table_name)}
    if column.name not in columns:
        op.add_column(table_name, column)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    add_column_if_missing("workspaces", sa.Column("detection_profile", sa.String(), nullable=False, server_default="web-balanced"))

    add_column_if_missing("alerts", sa.Column("signature_msg", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("signature_class", sa.String(), nullable=True))
    add_column_if_missing("alerts", sa.Column("signature_sid", sa.Integer(), nullable=True))
    add_column_if_missing("alerts", sa.Column("signature_gid", sa.Integer(), nullable=True))

    if not inspector.has_table("detection_rules"):
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
        op.create_index(op.f("ix_detection_rules_id"), "detection_rules", ["id"], unique=False)
        op.create_index(op.f("ix_detection_rules_workspace_id"), "detection_rules", ["workspace_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("detection_rules"):
        op.drop_index(op.f("ix_detection_rules_workspace_id"), table_name="detection_rules")
        op.drop_index(op.f("ix_detection_rules_id"), table_name="detection_rules")
        op.drop_table("detection_rules")

    for column in ["signature_gid", "signature_sid", "signature_class", "signature_msg"]:
        op.drop_column("alerts", column)
    op.drop_column("workspaces", "detection_profile")
