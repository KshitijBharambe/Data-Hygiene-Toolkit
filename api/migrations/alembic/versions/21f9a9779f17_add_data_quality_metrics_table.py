"""add_data_quality_metrics_table

Revision ID: 21f9a9779f17
Revises: b7c8d9e0f1g2
Create Date: 2025-10-10 00:23:17.171457

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '21f9a9779f17'
down_revision: Union[str, None] = 'b7c8d9e0f1g2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create data_quality_metrics table
    op.create_table(
        'data_quality_metrics',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('execution_id', sa.String(), nullable=False),
        sa.Column('dataset_version_id', sa.String(), nullable=False),
        sa.Column('dqi', sa.Float(), nullable=False, server_default='0'),
        sa.Column('clean_rows_pct', sa.Float(), nullable=False, server_default='0'),
        sa.Column('hybrid', sa.Float(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(), nullable=False, server_default='not_available'),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('computed_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['execution_id'], ['executions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dataset_version_id'], ['dataset_versions.id'], ondelete='CASCADE')
    )

    # Create index on execution_id for fast lookups
    op.create_index(
        'ix_data_quality_metrics_execution_id',
        'data_quality_metrics',
        ['execution_id'],
        unique=True  # One metric record per execution
    )

    # Create index on dataset_version_id for version-based queries
    op.create_index(
        'ix_data_quality_metrics_dataset_version_id',
        'data_quality_metrics',
        ['dataset_version_id']
    )


def downgrade() -> None:
    # Drop indices first
    op.drop_index('ix_data_quality_metrics_dataset_version_id', table_name='data_quality_metrics')
    op.drop_index('ix_data_quality_metrics_execution_id', table_name='data_quality_metrics')

    # Drop table
    op.drop_table('data_quality_metrics')
