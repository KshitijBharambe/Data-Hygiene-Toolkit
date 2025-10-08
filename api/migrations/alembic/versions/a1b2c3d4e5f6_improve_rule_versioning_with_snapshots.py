"""Improve rule versioning with snapshots and family ID

Revision ID: a1b2c3d4e5f6
Revises: 9a4f8e2b1c5d
Create Date: 2025-10-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '9a4f8e2b1c5d'
branch_labels = None
depends_on = None


def upgrade():
    """Add rule_family_id and snapshot fields, update FK constraints"""

    # Add rule_family_id to rules table
    op.add_column('rules', sa.Column('rule_family_id', sa.String(), nullable=True))
    op.create_index('ix_rules_rule_family_id', 'rules', ['rule_family_id'])
    op.create_foreign_key(
        'fk_rules_rule_family_id',
        'rules', 'rules',
        ['rule_family_id'], ['id'],
        ondelete='SET NULL'
    )

    # Add partial unique index on (name, is_latest) WHERE is_latest=true
    # This ensures only one latest version per rule name
    op.execute("""
        CREATE UNIQUE INDEX ix_rules_name_is_latest_unique
        ON rules(name)
        WHERE is_latest = true
    """)

    # Backfill rule_family_id for existing rules
    # If parent_rule_id is null, rule_family_id = id (this is the root)
    # If parent_rule_id exists, we need to find the root
    op.execute("""
        WITH RECURSIVE rule_tree AS (
            -- Base case: rules without parents are their own family root
            SELECT id, id as root_id, parent_rule_id
            FROM rules
            WHERE parent_rule_id IS NULL

            UNION ALL

            -- Recursive case: find the root for child rules
            SELECT r.id, rt.root_id, r.parent_rule_id
            FROM rules r
            INNER JOIN rule_tree rt ON r.parent_rule_id = rt.id
        )
        UPDATE rules
        SET rule_family_id = rule_tree.root_id
        FROM rule_tree
        WHERE rules.id = rule_tree.id
    """)

    # Update ExecutionRule table
    # 1. Drop existing FK constraint on rule_id
    op.drop_constraint('execution_rules_rule_id_fkey', 'execution_rules', type_='foreignkey')

    # 2. Alter rule_id to be nullable
    op.alter_column('execution_rules', 'rule_id',
                    existing_type=sa.String(),
                    nullable=True)

    # 3. Add new FK with ON DELETE SET NULL
    op.create_foreign_key(
        'fk_execution_rules_rule_id',
        'execution_rules', 'rules',
        ['rule_id'], ['id'],
        ondelete='SET NULL'
    )

    # 4. Add rule_snapshot column
    op.add_column('execution_rules', sa.Column('rule_snapshot', sa.Text(), nullable=True))

    # Update Issue table
    # 1. Drop existing FK constraint on rule_id
    op.drop_constraint('issues_rule_id_fkey', 'issues', type_='foreignkey')

    # 2. Alter rule_id to be nullable
    op.alter_column('issues', 'rule_id',
                    existing_type=sa.String(),
                    nullable=True)

    # 3. Add new FK with ON DELETE SET NULL
    op.create_foreign_key(
        'fk_issues_rule_id',
        'issues', 'rules',
        ['rule_id'], ['id'],
        ondelete='SET NULL'
    )

    # 4. Add rule_snapshot column
    op.add_column('issues', sa.Column('rule_snapshot', sa.Text(), nullable=True))


def downgrade():
    """Remove snapshot fields and revert FK constraints"""

    # Remove rule_snapshot from issues
    op.drop_column('issues', 'rule_snapshot')

    # Revert issues FK constraint
    op.drop_constraint('fk_issues_rule_id', 'issues', type_='foreignkey')
    op.alter_column('issues', 'rule_id',
                    existing_type=sa.String(),
                    nullable=False)
    op.create_foreign_key(
        'issues_rule_id_fkey',
        'issues', 'rules',
        ['rule_id'], ['id']
    )

    # Remove rule_snapshot from execution_rules
    op.drop_column('execution_rules', 'rule_snapshot')

    # Revert execution_rules FK constraint
    op.drop_constraint('fk_execution_rules_rule_id', 'execution_rules', type_='foreignkey')
    op.alter_column('execution_rules', 'rule_id',
                    existing_type=sa.String(),
                    nullable=False)
    op.create_foreign_key(
        'execution_rules_rule_id_fkey',
        'execution_rules', 'rules',
        ['rule_id'], ['id']
    )

    # Drop partial unique index
    op.drop_index('ix_rules_name_is_latest_unique', 'rules')

    # Drop rule_family_id from rules
    op.drop_constraint('fk_rules_rule_family_id', 'rules', type_='foreignkey')
    op.drop_index('ix_rules_rule_family_id', 'rules')
    op.drop_column('rules', 'rule_family_id')
