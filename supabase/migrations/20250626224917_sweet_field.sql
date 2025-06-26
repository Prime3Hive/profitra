/*
  # Fix RLS infinite recursion and user ID handling

  1. Security Functions
    - Create `is_admin()` function to check admin role without recursion
    - Use SECURITY DEFINER to bypass RLS within the function

  2. Policy Updates
    - Replace all recursive role checks with the new `is_admin()` function
    - Ensure all policies use proper user identification

  3. Profile Structure
    - Ensure profiles table has proper user_id reference
*/

-- Create a secure function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Anyone can view active investment plans" ON public.investment_plans;
DROP POLICY IF EXISTS "Only admins can modify investment plans" ON public.investment_plans;

DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON public.investments;
DROP POLICY IF EXISTS "Admins can view all investments" ON public.investments;
DROP POLICY IF EXISTS "Admins can modify all investments" ON public.investments;

DROP POLICY IF EXISTS "Users can view their own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can create their own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can modify all deposits" ON public.deposits;

DROP POLICY IF EXISTS "Users can view their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can create their own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can modify all deposit requests" ON public.deposit_requests;

DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create their own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can modify all withdrawal requests" ON public.withdrawal_requests;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can modify all transactions" ON public.transactions;

DROP POLICY IF EXISTS "Only admins can view admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Only admins can modify admin settings" ON public.admin_settings;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can create audit logs" ON public.audit_logs;

-- Recreate profiles policies without recursion
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Investment plans policies
CREATE POLICY "Anyone can view active investment plans"
  ON public.investment_plans FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can modify investment plans"
  ON public.investment_plans FOR ALL
  USING (public.is_admin());

-- Investments policies
CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments"
  ON public.investments FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can modify all investments"
  ON public.investments FOR ALL
  USING (public.is_admin());

-- Deposits policies
CREATE POLICY "Users can view their own deposits"
  ON public.deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposits"
  ON public.deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits"
  ON public.deposits FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can modify all deposits"
  ON public.deposits FOR ALL
  USING (public.is_admin());

-- Deposit requests policies
CREATE POLICY "Users can view their own deposit requests"
  ON public.deposit_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposit requests"
  ON public.deposit_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit requests"
  ON public.deposit_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can modify all deposit requests"
  ON public.deposit_requests FOR ALL
  USING (public.is_admin());

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can modify all withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  USING (public.is_admin());

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can modify all transactions"
  ON public.transactions FOR ALL
  USING (public.is_admin());

-- Admin settings policies
CREATE POLICY "Only admins can view admin settings"
  ON public.admin_settings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Only admins can modify admin settings"
  ON public.admin_settings FOR ALL
  USING (public.is_admin());

-- Audit logs policies
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Only admins can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_admin());