/*
  # Database Schema Setup for Investment Platform

  1. New Tables
    - `profiles` - User profile information with wallet addresses and balance
    - `investment_plans` - Available investment plans with ROI and duration
    - `investments` - User investments tracking
    - `deposit_requests` - Deposit confirmation requests
    - `withdrawal_requests` - Withdrawal requests
    - `transactions` - Transaction history

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Add admin access policies
*/

-- Create helper functions first
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION uid()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  btc_wallet TEXT,
  usdt_wallet TEXT,
  role TEXT DEFAULT 'user'::TEXT,
  balance NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_id UNIQUE (user_id),
  CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['user'::TEXT, 'admin'::TEXT]))
);

-- INVESTMENT PLANS TABLE
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_amount NUMERIC(12,2) NOT NULL,
  max_amount NUMERIC(12,2),
  roi NUMERIC(5,2) NOT NULL,
  duration_hours INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT investment_plans_pkey PRIMARY KEY (id)
);

-- INVESTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.investment_plans(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  roi NUMERIC(12,2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active'::TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT investments_pkey PRIMARY KEY (id),
  CONSTRAINT investments_status_check CHECK (status = ANY (ARRAY['active'::TEXT, 'completed'::TEXT, 'cancelled'::TEXT]))
);

-- DEPOSIT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT deposit_requests_pkey PRIMARY KEY (id),
  CONSTRAINT check_deposit_amount_positive CHECK (amount > 0),
  CONSTRAINT deposit_requests_currency_check CHECK (currency = ANY (ARRAY['BTC'::TEXT, 'USDT'::TEXT])),
  CONSTRAINT deposit_requests_status_check CHECK (status = ANY (ARRAY['pending'::TEXT, 'confirmed'::TEXT, 'rejected'::TEXT]))
);

-- WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id),
  CONSTRAINT check_withdrawal_amount_positive CHECK (amount > 0),
  CONSTRAINT withdrawal_requests_currency_check CHECK (currency = ANY (ARRAY['BTC'::TEXT, 'USDT'::TEXT])),
  CONSTRAINT withdrawal_requests_status_check CHECK (status = ANY (ARRAY['pending'::TEXT, 'approved'::TEXT, 'completed'::TEXT, 'rejected'::TEXT]))
);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_type_check CHECK (type = ANY (ARRAY['deposit'::TEXT, 'investment'::TEXT, 'roi_return'::TEXT, 'reinvestment'::TEXT, 'withdrawal'::TEXT]))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON public.deposit_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON public.deposit_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests USING btree (status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (is_admin());

-- Create RLS Policies for investment_plans
DROP POLICY IF EXISTS "Anyone can view active investment plans" ON public.investment_plans;
CREATE POLICY "Anyone can view active investment plans"
  ON public.investment_plans FOR SELECT
  USING ((is_active = true) OR is_admin());

DROP POLICY IF EXISTS "Only admins can modify investment plans" ON public.investment_plans;
CREATE POLICY "Only admins can modify investment plans"
  ON public.investment_plans FOR ALL
  USING (is_admin());

-- Create RLS Policies for investments
DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT
  USING (uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own investments" ON public.investments;
CREATE POLICY "Users can create their own investments"
  ON public.investments FOR INSERT
  WITH CHECK (uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all investments" ON public.investments;
CREATE POLICY "Admins can view all investments"
  ON public.investments FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can modify all investments" ON public.investments;
CREATE POLICY "Admins can modify all investments"
  ON public.investments FOR ALL
  USING (is_admin());

-- Create RLS Policies for deposit_requests
DROP POLICY IF EXISTS "Users can view their own deposit requests" ON public.deposit_requests;
CREATE POLICY "Users can view their own deposit requests"
  ON public.deposit_requests FOR SELECT
  USING (uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own deposit requests" ON public.deposit_requests;
CREATE POLICY "Users can create their own deposit requests"
  ON public.deposit_requests FOR INSERT
  WITH CHECK (uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all deposit requests" ON public.deposit_requests;
CREATE POLICY "Admins can view all deposit requests"
  ON public.deposit_requests FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can modify all deposit requests" ON public.deposit_requests;
CREATE POLICY "Admins can modify all deposit requests"
  ON public.deposit_requests FOR ALL
  USING (is_admin());

-- Create RLS Policies for withdrawal_requests
DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can view their own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can create their own withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Admins can view all withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can modify all withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Admins can modify all withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  USING (is_admin());

-- Create RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can modify all transactions" ON public.transactions;
CREATE POLICY "Admins can modify all transactions"
  ON public.transactions FOR ALL
  USING (is_admin());

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role, balance)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), 'user', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample investment plans
INSERT INTO public.investment_plans (name, min_amount, max_amount, roi, duration_hours, is_active)
SELECT 'Starter', 50, 1000, 5.00, 24, true
WHERE NOT EXISTS (SELECT 1 FROM public.investment_plans WHERE name = 'Starter');

INSERT INTO public.investment_plans (name, min_amount, max_amount, roi, duration_hours, is_active)
SELECT 'Silver', 1000, 4990, 10.00, 48, true
WHERE NOT EXISTS (SELECT 1 FROM public.investment_plans WHERE name = 'Silver');

INSERT INTO public.investment_plans (name, min_amount, max_amount, roi, duration_hours, is_active)
SELECT 'Gold', 5000, 10000, 15.00, 72, true
WHERE NOT EXISTS (SELECT 1 FROM public.investment_plans WHERE name = 'Gold');

INSERT INTO public.investment_plans (name, min_amount, max_amount, roi, duration_hours, is_active)
SELECT 'Platinum', 10000, NULL, 20.00, 168, true
WHERE NOT EXISTS (SELECT 1 FROM public.investment_plans WHERE name = 'Platinum');