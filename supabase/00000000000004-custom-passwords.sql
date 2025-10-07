-- ============================================================================
-- Custom Password Configuration
-- ============================================================================
-- This script sets passwords for Supabase users that were created by the
-- official Supabase init scripts. Run AFTER official Supabase initialization.
-- ============================================================================

-- Set password for postgres user (if it exists)
DO
$$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
    ALTER ROLE postgres WITH PASSWORD 'postgres';
  END IF;
END
$$;

-- Set password for supabase_auth_admin
DO
$$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    ALTER ROLE supabase_auth_admin WITH PASSWORD 'postgres';
  END IF;
END
$$;

-- Set password for authenticator
DO
$$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
    ALTER ROLE authenticator WITH PASSWORD 'postgres';
  END IF;
END
$$;

-- Set password for supabase_storage_admin
DO
$$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    ALTER ROLE supabase_storage_admin WITH PASSWORD 'postgres';
  END IF;
END
$$;

-- Set password for supabase_admin
DO
$$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
    ALTER ROLE supabase_admin WITH PASSWORD 'postgres';
  END IF;
END
$$;

-- Set password for supabase (used by meta service)
DO
$$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase') THEN
    ALTER ROLE supabase WITH PASSWORD 'postgres';
  END IF;
END
$$;

-- Set password for dashboard_user (if it exists)
DO
$$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dashboard_user') THEN
    ALTER ROLE dashboard_user WITH PASSWORD 'postgres';
  END IF;
END
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Custom password configuration completed successfully!';
  RAISE NOTICE 'All Supabase users now have the password set from POSTGRES_PASSWORD';
END $$;
