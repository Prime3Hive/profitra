-- Create test users with unique timestamped emails
-- This script creates both an admin and a regular user for testing

-- Generate unique timestamp for email addresses to avoid conflicts
DO $$
DECLARE
  timestamp_str TEXT := to_char(NOW(), 'YYYYMMDD_HH24MISS');
  admin_email TEXT;
  user_email TEXT;
  admin_user_id UUID;
  normal_user_id UUID;
BEGIN
  -- Create unique email addresses with timestamps
  admin_email := 'admin_' || timestamp_str || '@profitra.com';
  user_email := 'user_' || timestamp_str || '@profitra.com';
  
  -- 1. Create Admin User
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    admin_email,
    crypt('adminpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO admin_user_id;
  
  -- Manually create admin profile (in case trigger doesn't work)
  INSERT INTO public.profiles (user_id, name, role, balance)
  VALUES (admin_user_id, 'Admin User', 'admin', 10000.00);
  
  -- 2. Create Normal User
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt('userpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO normal_user_id;
  
  -- Manually create normal user profile (in case trigger doesn't work)
  INSERT INTO public.profiles (user_id, name, role, balance)
  VALUES (normal_user_id, 'Test User', 'user', 1000.00);
  
  -- Output the created user emails for reference
  RAISE NOTICE 'Created admin user: %', admin_email;
  RAISE NOTICE 'Created normal user: %', user_email;
  RAISE NOTICE 'Admin password: adminpassword123';
  RAISE NOTICE 'User password: userpassword123';
END;
$$;
