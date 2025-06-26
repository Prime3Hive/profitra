-- SQL script to clean Supabase database before applying schema
-- This will drop all tables in reverse order of dependencies

-- First, disable Row Level Security triggers temporarily to avoid permission issues
SET session_replication_role = 'replica';

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS investment_plans CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Re-enable Row Level Security triggers
SET session_replication_role = 'origin';

-- Output confirmation
SELECT 'Database cleaned successfully. Ready for new schema.' as message;
