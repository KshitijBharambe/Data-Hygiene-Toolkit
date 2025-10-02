"""Add rule versioning support

Revision ID: 9a4f8e2b1c5d
Revises: f3f72ff529c3
Create Date: 2025-10-01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9a4f8e2b1c5d'
down_revision = 'f3f72ff529c3'
branch_labels = None
depends_on = None


def upgrade():
    """Add versioning columns to rules table"""
    
    # Drop unique constraint on name (if exists)
    # This may need to be adjusted based on your database
    try:
        op.drop_constraint('rules_name_key', 'rules', type_='unique')
    except:
        pass  # Constraint might not exist
    
    # Add versioning columns
    op.add_column('rules', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('rules', sa.Column('parent_rule_id', sa.String(), nullable=True))
    op.add_column('rules', sa.Column('is_latest', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('rules', sa.Column('change_log', sa.Text(), nullable=True))
    
    # Add foreign key constraint for parent_rule_id
    op.create_foreign_key(
        'fk_rules_parent_rule_id',
        'rules', 'rules',
        ['parent_rule_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Add index on name for faster lookups
    op.create_index('ix_rules_name', 'rules', ['name'])
    
    # Add index on is_latest for faster queries
    op.create_index('ix_rules_is_latest', 'rules', ['is_latest'])


def downgrade():
    """Remove versioning columns from rules table"""
    
    # Drop indexes
    op.drop_index('ix_rules_is_latest', 'rules')
    op.drop_index('ix_rules_name', 'rules')
    
    # Drop foreign key constraint
    op.drop_constraint('fk_rules_parent_rule_id', 'rules', type_='foreignkey')
    
    # Drop versioning columns
    op.drop_column('rules', 'change_log')
    op.drop_column('rules', 'is_latest')
    op.drop_column('rules', 'parent_rule_id')
    op.drop_column('rules', 'version')
    
    # Re-add unique constraint on name
    op.create_unique_constraint('rules_name_key', 'rules', ['name'])
