"""Merge rule dependency management with data quality metrics

Revision ID: 1903bb90c0fb
Revises: 21f9a9779f17, 1a2b3c4d5e6f
Create Date: 2025-10-16 00:01:51.455347

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1903bb90c0fb'
down_revision: Union[str, None] = ('21f9a9779f17', '1a2b3c4d5e6f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
