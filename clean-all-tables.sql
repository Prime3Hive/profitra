-- Script to clean all tables in the database while preserving table structures
-- This will delete all data from the tables in the correct order to respect foreign key constraints

-- First, disable triggers temporarily to avoid trigger-related issues during deletion
SET session_replication_role = 'replica';

-- Delete from tables in the correct order to avoid foreign key constraint violations
-- Start with tables that have foreign keys referencing other tables
DELETE FROM public.transactions;
DELETE FROM public.investments;
DELETE FROM public.deposits;
DELETE FROM public.deposit_requests;
DELETE FROM public.withdrawal_requests;

-- Then delete from tables that are referenced by foreign keys
DELETE FROM public.investment_plans;
DELETE FROM public.profiles;

-- Delete from other tables if they exist
DELETE FROM public.admin_settings;
DELETE FROM public.audit_logs;

-- Attempt to delete from auth.users (this may fail due to permissions)
-- Note: This requires elevated permissions and may not work in all Supabase environments
DO $$
BEGIN
    -- Try to delete all users except service role users
    DELETE FROM auth.users WHERE email NOT LIKE 'service-role%';
    RAISE NOTICE 'Auth users deleted successfully.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not delete auth users due to permissions: %', SQLERRM;
    RAISE NOTICE 'You may need to delete users through the Supabase Dashboard UI.';
END $$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Output confirmation message
DO $$
BEGIN
    RAISE NOTICE 'All public schema tables have been cleaned successfully.';
END $$;
