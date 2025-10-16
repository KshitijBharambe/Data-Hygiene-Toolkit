"""Add rule dependency management

Revision ID: 1a2b3c4d5e6f
Revises: f3f72ff529c3
Create Date: 2025-10-15 23:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, None] = 'f3f72ff529c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add dependency fields to rules table
    op.add_column('rules', sa.Column('dependencies', sa.Text(), nullable=True))
    op.add_column('rules', sa.Column(
        'priority', sa.Integer(), nullable=True, default=0))
    op.add_column('rules', sa.Column(
        'execution_order', sa.Integer(), nullable=True))
    op.add_column('rules', sa.Column(
        'dependency_group', sa.String(), nullable=True))

    # Add indexes for dependency management
    op.create_index('ix_rules_priority', 'rules', ['priority'])
    op.create_index('ix_rules_execution_order', 'rules', ['execution_order'])
    op.create_index('ix_rules_dependency_group', 'rules', ['dependency_group'])


def downgrade() -> None:
    # Remove indexes
    op.drop_index('ix_rules_dependency_group', table_name='rules')
    op.drop_index('ix_rules_execution_order', table_name='rules')
    op.drop_index('ix_rules_priority', table_name='rules')

    # Remove columns
    op.drop_column('rules', 'dependency_group')
    op.drop_column('rules', 'execution_order')
    op.drop_column('rules', 'priority')
    op.drop_column('rules', 'dependencies')
