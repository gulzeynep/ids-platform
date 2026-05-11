"""add monitored websites runtime table

Revision ID: 9d61b98e4b21
Revises: f3acdf067d46
Create Date: 2026-05-11 23:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9d61b98e4b21"
down_revision: Union[str, Sequence[str], None] = "f3acdf067d46"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("monitored_websites"):
        op.create_table(
            "monitored_websites",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("domain", sa.String(), nullable=False),
            sa.Column("target_ip", sa.String(), nullable=False),
            sa.Column("target_port", sa.Integer(), nullable=False),
            sa.Column("scheme", sa.String(), nullable=False, server_default="http"),
            sa.Column("is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_monitored_websites_id"), "monitored_websites", ["id"], unique=False)
        op.create_index(op.f("ix_monitored_websites_domain"), "monitored_websites", ["domain"], unique=False)
        op.create_index(op.f("ix_monitored_websites_workspace_id"), "monitored_websites", ["workspace_id"], unique=False)
    else:
        columns = {column["name"] for column in inspector.get_columns("monitored_websites")}
        if "scheme" not in columns:
            op.add_column("monitored_websites", sa.Column("scheme", sa.String(), nullable=False, server_default="http"))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("monitored_websites"):
        op.drop_index(op.f("ix_monitored_websites_workspace_id"), table_name="monitored_websites")
        op.drop_index(op.f("ix_monitored_websites_domain"), table_name="monitored_websites")
        op.drop_index(op.f("ix_monitored_websites_id"), table_name="monitored_websites")
        op.drop_table("monitored_websites")
