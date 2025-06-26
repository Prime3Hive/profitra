-- Complete Schema Setup for Profitra Investment Platform
-- This script sets up all required tables, triggers, functions, and RLS policies

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at column update function
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_id UNIQUE (user_id),
  CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['user'::TEXT, 'admin'::TEXT]))
);

-- Create trigger for profiles
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- INVESTMENT PLANS TABLE
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_amount NUMERIC(12,2) NOT NULL,
  max_amount NUMERIC(12,2),
  roi_percent NUMERIC(5,2) NOT NULL,
  duration_hours INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  CONSTRAINT investment_plans_pkey PRIMARY KEY (id)
);

-- Create trigger for investment_plans
CREATE TRIGGER update_investment_plans_timestamp
BEFORE UPDATE ON public.investment_plans
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- INVESTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.investment_plans(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  roi_amount NUMERIC(12,2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active'::TEXT,
  is_reinvestment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  CONSTRAINT investments_pkey PRIMARY KEY (id),
  CONSTRAINT investments_status_check CHECK (status = ANY (ARRAY['active'::TEXT, 'completed'::TEXT, 'cancelled'::TEXT]))
);

-- Create trigger for investments
CREATE TRIGGER update_investments_timestamp
BEFORE UPDATE ON public.investments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending'::TEXT,
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  confirmed_date TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES auth.users(id),
  transaction_hash TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  CONSTRAINT deposits_pkey PRIMARY KEY (id),
  CONSTRAINT deposits_currency_check CHECK (currency = ANY (ARRAY['BTC'::TEXT, 'USDT'::TEXT])),
  CONSTRAINT deposits_status_check CHECK (status = ANY (ARRAY['pending'::TEXT, 'confirmed'::TEXT, 'rejected'::TEXT]))
);

-- Create trigger for deposits
CREATE TRIGGER update_deposits_timestamp
BEFORE UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

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

-- Create indexes for deposit_requests
CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON public.deposit_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON public.deposit_requests USING btree (status);

-- Create trigger for deposit_requests
CREATE TRIGGER update_deposit_requests_updated_at
BEFORE UPDATE ON public.deposit_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create indexes for withdrawal_requests
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests USING btree (status);

-- Create trigger for withdrawal_requests
CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  investment_id UUID REFERENCES public.investments(id),
  deposit_id UUID REFERENCES public.deposits(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_type_check CHECK (type = ANY (ARRAY['deposit'::TEXT, 'investment'::TEXT, 'roi_return'::TEXT, 'reinvestment'::TEXT, 'withdrawal'::TEXT]))
);

-- ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  CONSTRAINT admin_settings_pkey PRIMARY KEY (id)
);

-- Create trigger for admin_settings
CREATE TRIGGER update_admin_settings_timestamp
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::TEXT, NOW()),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Allow insert for authentication service"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Investment plans policies
CREATE POLICY "Anyone can view active investment plans"
  ON public.investment_plans FOR SELECT
  USING (is_active = true OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can modify investment plans"
  ON public.investment_plans FOR ALL
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Investments policies
CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments"
  ON public.investments FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can modify all investments"
  ON public.investments FOR ALL
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Deposits policies
CREATE POLICY "Users can view their own deposits"
  ON public.deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposits"
  ON public.deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits"
  ON public.deposits FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can modify all deposits"
  ON public.deposits FOR ALL
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Deposit requests policies
CREATE POLICY "Users can view their own deposit requests"
  ON public.deposit_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposit requests"
  ON public.deposit_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit requests"
  ON public.deposit_requests FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can modify all deposit requests"
  ON public.deposit_requests FOR ALL
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can modify all withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can modify all transactions"
  ON public.transactions FOR ALL
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Admin settings policies
CREATE POLICY "Only admins can view admin settings"
  ON public.admin_settings FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can modify admin settings"
  ON public.admin_settings FOR ALL
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Audit logs policies
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role, balance)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), 'user', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create sample investment plans
INSERT INTO public.investment_plans (name, min_amount, max_amount, roi_percent, duration_hours, is_active)
VALUES 
  ('Starter Plan', 100, 1000, 5.00, 24, true),
  ('Growth Plan', 1000, 5000, 7.50, 48, true),
  ('Premium Plan', 5000, 20000, 10.00, 72, true),
  ('Elite Plan', 20000, NULL, 15.00, 120, true);