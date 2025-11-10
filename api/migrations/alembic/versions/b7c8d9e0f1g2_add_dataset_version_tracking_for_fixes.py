"""add dataset version tracking for fixes

Revision ID: b7c8d9e0f1g2
Revises: a1b2c3d4e5f6
Create Date: 2025-01-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b7c8d9e0f1g2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Create VersionSource enum
    version_source_enum = postgresql.ENUM(
        'upload', 'fixes_applied', 'manual_edit', 'transformation',
        name='versionsource'
    )
    version_source_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns to dataset_versions table
    op.add_column('dataset_versions', sa.Column('parent_version_id', sa.String(), nullable=True))
    op.add_column('dataset_versions', sa.Column('source', version_source_enum, nullable=False, server_default='upload'))
    op.add_column('dataset_versions', sa.Column('file_path', sa.String(), nullable=True))
    op.create_foreign_key(
        'fk_dataset_versions_parent_version_id',
        'dataset_versions', 'dataset_versions',
        ['parent_version_id'], ['id']
    )

    # Add new columns to fixes table
    op.add_column('fixes', sa.Column('applied_in_version_id', sa.String(), nullable=True))
    op.add_column('fixes', sa.Column('applied_at', sa.TIMESTAMP(timezone=True), nullable=True))
    op.create_foreign_key(
        'fk_fixes_applied_in_version_id',
        'fixes', 'dataset_versions',
        ['applied_in_version_id'], ['id']
    )

    # Create index for faster queries
    op.create_index('ix_fixes_applied_in_version_id', 'fixes', ['applied_in_version_id'])
    op.create_index('ix_dataset_versions_parent_version_id', 'dataset_versions', ['parent_version_id'])
    op.create_index('ix_dataset_versions_source', 'dataset_versions', ['source'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_dataset_versions_source', table_name='dataset_versions')
    op.drop_index('ix_dataset_versions_parent_version_id', table_name='dataset_versions')
    op.drop_index('ix_fixes_applied_in_version_id', table_name='fixes')

    # Drop foreign keys
    op.drop_constraint('fk_fixes_applied_in_version_id', 'fixes', type_='foreignkey')
    op.drop_constraint('fk_dataset_versions_parent_version_id', 'dataset_versions', type_='foreignkey')

    # Drop columns from fixes
    op.drop_column('fixes', 'applied_at')
    op.drop_column('fixes', 'applied_in_version_id')

    # Drop columns from dataset_versions
    op.drop_column('dataset_versions', 'file_path')
    op.drop_column('dataset_versions', 'source')
    op.drop_column('dataset_versions', 'parent_version_id')

    # Drop enum
    sa.Enum(name='versionsource').drop(op.get_bind(), checkfirst=True)
