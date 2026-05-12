"""add alert flags

Revision ID: d1f4c7b8e9a2
Revises: a0b7854b7942
Create Date: 2026-05-10 15:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1f4c7b8e9a2"
down_revision: Union[str, Sequence[str], None] = "a0b7854b7942"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "alerts",
        sa.Column("is_flagged", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column(
        "alerts",
        sa.Column("is_saved", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("alerts", "is_saved")
    op.drop_column("alerts", "is_flagged")
