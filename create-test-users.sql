-- Create test users for development and testing purposes with unique timestamped emails

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
CREATE OR REPLACE FUNCTION create_test_user(
  email TEXT,
  password TEXT,
  name TEXT,
  user_role TEXT DEFAULT 'user',
  initial_balance NUMERIC DEFAULT 0.00
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
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
    email,
    crypt(password, gen_salt('bf')),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('name', name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;
  
  -- Insert into profiles (if trigger doesn't work)
  -- The trigger should handle this automatically, but just in case:
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = new_user_id) THEN
    INSERT INTO public.profiles (user_id, name, role, balance)
    VALUES (new_user_id, name, user_role, initial_balance);
  END IF;
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin user with function
SELECT create_test_user(
  'admin_test@profitra.com',
  'adminpassword123',
  'Admin User',
  'admin',
  10000.00
);

-- Create normal user with function
SELECT create_test_user(
  'user_test@profitra.com',
  'userpassword123',
  'Test User',
  'user',
  1000.00
);

-- Drop the function after use
DROP FUNCTION IF EXISTS create_test_user;
