-- ============================================================================
-- Pre-initialization Script
-- ============================================================================
-- This script runs BEFORE official Supabase init scripts to create the
-- postgres role that the official scripts expect
-- ============================================================================

-- Create postgres superuser role with password
CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Pre-initialization complete: postgres role created';
END $$;
