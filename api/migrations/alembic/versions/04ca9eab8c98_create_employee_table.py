"""Create employee table

Revision ID: 04ca9eab8c98
Revises: 
Create Date: 2025-07-26 15:30:00.861000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '04ca9eab8c98'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table("employee", 
                    sa.Column("Id", sa.Integer, primary_key=True), 
                    sa.Column("name", sa.String(50), nullable=False),
                    sa.Column("Current",sa.Boolean, default=True))


def downgrade() -> None:
    op.drop_table("employee")
