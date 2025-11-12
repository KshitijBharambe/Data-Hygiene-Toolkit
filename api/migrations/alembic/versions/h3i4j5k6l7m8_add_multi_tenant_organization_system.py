"""add multi-tenant organization system

Revision ID: h3i4j5k6l7m8
Revises: 1903bb90c0fb
Create Date: 2025-01-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime, timedelta

# revision identifiers, used by Alembic.
revision = 'h3i4j5k6l7m8'
down_revision = '1903bb90c0fb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create new enums (with IF NOT EXISTS for idempotency)
    op.execute("DO $$ BEGIN CREATE TYPE sharepermission AS ENUM ('view', 'use', 'clone'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE invitestatus AS ENUM ('pending', 'accepted', 'expired', 'revoked'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    # Update UserRole enum to include 'owner' (only if it doesn't exist)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'owner' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'userrole')) THEN
                ALTER TYPE userrole ADD VALUE 'owner';
            END IF;
        END $$;
    """)

    # Drop existing users table indexes before archiving
    op.execute("DROP INDEX IF EXISTS ix_users_id")
    op.execute("DROP INDEX IF EXISTS ix_users_email")

    # Archive existing users table
    op.execute("ALTER TABLE users RENAME TO users_archived")

    # Create new users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('auth_provider', sa.String(), nullable=True, default='local'),
        sa.Column('auth_subject', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('contact_email', sa.String(), nullable=False),
        sa.Column('settings', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_organizations_id'), 'organizations', ['id'], unique=False)
    op.create_index(op.f('ix_organizations_slug'), 'organizations', ['slug'], unique=True)

    # Create organization_members table
    op.create_table(
        'organization_members',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('organization_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('role', postgresql.ENUM('owner', 'admin', 'analyst', 'viewer', name='userrole', create_type=False), nullable=False),
        sa.Column('invited_by', sa.String(), nullable=True),
        sa.Column('joined_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invited_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_organization_members_id'), 'organization_members', ['id'], unique=False)

    # Create organization_invites table
    op.create_table(
        'organization_invites',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('organization_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('role', postgresql.ENUM('owner', 'admin', 'analyst', 'viewer', name='userrole', create_type=False), nullable=False),
        sa.Column('invited_by', sa.String(), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'accepted', 'expired', 'revoked', name='invitestatus', create_type=False), nullable=True, server_default='pending'),
        sa.Column('invite_token', sa.String(), nullable=False),
        sa.Column('expires_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('accepted_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invited_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_organization_invites_id'), 'organization_invites', ['id'], unique=False)
    op.create_index(op.f('ix_organization_invites_email'), 'organization_invites', ['email'], unique=False)
    op.create_index(op.f('ix_organization_invites_invite_token'), 'organization_invites', ['invite_token'], unique=True)

    # Create resource_shares table
    op.create_table(
        'resource_shares',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=False),
        sa.Column('resource_id', sa.String(), nullable=False),
        sa.Column('owner_org_id', sa.String(), nullable=False),
        sa.Column('shared_with_org_id', sa.String(), nullable=False),
        sa.Column('permission', postgresql.ENUM('view', 'use', 'clone', name='sharepermission', create_type=False), nullable=False),
        sa.Column('shared_by', sa.String(), nullable=False),
        sa.Column('expires_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('revoked_at', postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('revoked_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['owner_org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_with_org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['revoked_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resource_shares_id'), 'resource_shares', ['id'], unique=False)
    op.create_index(op.f('ix_resource_shares_resource_id'), 'resource_shares', ['resource_id'], unique=False)

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('organization_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=True),
        sa.Column('resource_id', sa.String(), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)

    # Update all foreign keys from users_archived to users
    op.drop_constraint('datasets_uploaded_by_fkey', 'datasets', type_='foreignkey')
    op.create_foreign_key('datasets_uploaded_by_fkey', 'datasets', 'users', ['uploaded_by'], ['id'])

    op.drop_constraint('rules_created_by_fkey', 'rules', type_='foreignkey')
    op.create_foreign_key('rules_created_by_fkey', 'rules', 'users', ['created_by'], ['id'])

    op.drop_constraint('dataset_versions_created_by_fkey', 'dataset_versions', type_='foreignkey')
    op.create_foreign_key('dataset_versions_created_by_fkey', 'dataset_versions', 'users', ['created_by'], ['id'])

    op.drop_constraint('executions_started_by_fkey', 'executions', type_='foreignkey')
    op.create_foreign_key('executions_started_by_fkey', 'executions', 'users', ['started_by'], ['id'])

    op.drop_constraint('exports_created_by_fkey', 'exports', type_='foreignkey')
    op.create_foreign_key('exports_created_by_fkey', 'exports', 'users', ['created_by'], ['id'])

    op.drop_constraint('fixes_fixed_by_fkey', 'fixes', type_='foreignkey')
    op.create_foreign_key('fixes_fixed_by_fkey', 'fixes', 'users', ['fixed_by'], ['id'])

    # Add organization_id to datasets table
    op.add_column('datasets', sa.Column('organization_id', sa.String(), nullable=True))
    op.create_foreign_key('fk_datasets_organization_id', 'datasets', 'organizations', ['organization_id'], ['id'], ondelete='CASCADE')
    op.create_index(op.f('ix_datasets_organization_id'), 'datasets', ['organization_id'], unique=False)

    # Add organization_id to rules table
    op.add_column('rules', sa.Column('organization_id', sa.String(), nullable=True))
    op.create_foreign_key('fk_rules_organization_id', 'rules', 'organizations', ['organization_id'], ['id'], ondelete='CASCADE')
    op.create_index(op.f('ix_rules_organization_id'), 'rules', ['organization_id'], unique=False)

    # Note: After running this migration, you will need to manually populate organizations
    # and set organization_id for existing data, then make the columns NOT NULL


def downgrade() -> None:
    # Remove organization_id from rules table
    op.drop_index(op.f('ix_rules_organization_id'), table_name='rules')
    op.drop_constraint('fk_rules_organization_id', 'rules', type_='foreignkey')
    op.drop_column('rules', 'organization_id')

    # Remove organization_id from datasets table
    op.drop_index(op.f('ix_datasets_organization_id'), table_name='datasets')
    op.drop_constraint('fk_datasets_organization_id', 'datasets', type_='foreignkey')
    op.drop_column('datasets', 'organization_id')

    # Restore users table from archive
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
    op.execute("ALTER TABLE users_archived RENAME TO users")

    # Drop audit_logs table
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')

    # Drop resource_shares table
    op.drop_index(op.f('ix_resource_shares_resource_id'), table_name='resource_shares')
    op.drop_index(op.f('ix_resource_shares_id'), table_name='resource_shares')
    op.drop_table('resource_shares')

    # Drop organization_invites table
    op.drop_index(op.f('ix_organization_invites_invite_token'), table_name='organization_invites')
    op.drop_index(op.f('ix_organization_invites_email'), table_name='organization_invites')
    op.drop_index(op.f('ix_organization_invites_id'), table_name='organization_invites')
    op.drop_table('organization_invites')

    # Drop organization_members table
    op.drop_index(op.f('ix_organization_members_id'), table_name='organization_members')
    op.drop_table('organization_members')

    # Drop organizations table
    op.drop_index(op.f('ix_organizations_slug'), table_name='organizations')
    op.drop_index(op.f('ix_organizations_id'), table_name='organizations')
    op.drop_table('organizations')

    # Drop new enums (this will fail if UserRole 'owner' value is still in use)
    # Note: Removing enum values is complex in PostgreSQL and may require manual intervention
    op.execute("DROP TYPE IF EXISTS invitestatus")
    op.execute("DROP TYPE IF EXISTS sharepermission")
