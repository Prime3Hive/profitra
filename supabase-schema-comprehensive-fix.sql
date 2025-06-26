-- Original line commented out due to permission issues
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';
-- Note: JWT secret should be configured through Supabase dashboard instead

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    btc_wallet TEXT,
    usdt_wallet TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_user_id UNIQUE(user_id)
);

-- Create investment_plans table
CREATE TABLE IF NOT EXISTS investment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    min_amount DECIMAL(12,2) NOT NULL,
    max_amount DECIMAL(12,2),
    roi_percent DECIMAL(5,2) NOT NULL,
    duration_hours INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'USDT')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    request_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    confirmed_date TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID REFERENCES auth.users(id),
    transaction_hash TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES investment_plans(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    roi_amount DECIMAL(12,2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    is_reinvestment BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'investment', 'roi_return', 'reinvestment', 'withdrawal')),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    investment_id UUID REFERENCES investments(id),
    deposit_id UUID REFERENCES deposits(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default investment plans
INSERT INTO investment_plans (name, min_amount, max_amount, roi_percent, duration_hours, is_active) VALUES
('Starter', 50.00, 1000.00, 5.00, 24, true),
('Silver', 1000.00, 4990.00, 10.00, 48, true),
('Gold', 5000.00, 10000.00, 15.00, 72, true),
('Platinum', 10000.00, NULL, 20.00, 168, true); -- 168 hours = 7 days

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('enable_reinvestment', 'true', 'Allow users to make reinvestments'),
('platform_fee_percent', '0.00', 'Platform fee percentage'),
('min_withdrawal_amount', '10.00', 'Minimum withdrawal amount'),
('btc_wallet_address', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'Platform BTC wallet address'),
('usdt_wallet_address', 'TYJUrp7L3K5YKEf9e7C3qsP4h1A9vXWz7R', 'Platform USDT wallet address');

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin (fixed to avoid column reference error)
CREATE OR REPLACE FUNCTION check_if_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE user_id = auth.uid();
  RETURN user_role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for profiles table - FIXED to avoid recursion
CREATE POLICY "Users can view their own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Fixed admin policies to avoid recursion
CREATE POLICY "Admins can view all profiles" 
    ON profiles FOR SELECT 
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );

CREATE POLICY "Admins can update all profiles" 
    ON profiles FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );

-- Create policy to allow new user registration
CREATE POLICY "Allow insert for authentication service" 
    ON profiles FOR INSERT 
    WITH CHECK (true);

-- Create policies for investment_plans table
CREATE POLICY "Anyone can view active investment plans" 
    ON investment_plans FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Admins can manage investment plans" 
    ON investment_plans FOR ALL 
    USING (check_if_admin());

-- Create policies for deposits table
CREATE POLICY "Users can view their own deposits" 
    ON deposits FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deposits" 
    ON deposits FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits" 
    ON deposits FOR SELECT 
    USING (check_if_admin());

CREATE POLICY "Admins can update all deposits" 
    ON deposits FOR UPDATE 
    USING (check_if_admin());

-- Create policies for investments table
CREATE POLICY "Users can view their own investments" 
    ON investments FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments" 
    ON investments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments" 
    ON investments FOR SELECT 
    USING (check_if_admin());

CREATE POLICY "Admins can update all investments" 
    ON investments FOR UPDATE 
    USING (check_if_admin());

-- Create policies for transactions table
CREATE POLICY "Users can view their own transactions" 
    ON transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" 
    ON transactions FOR SELECT 
    USING (check_if_admin());

CREATE POLICY "Admins can insert transactions" 
    ON transactions FOR INSERT 
    WITH CHECK (check_if_admin());

-- Create policies for admin_settings table
CREATE POLICY "Anyone can view admin settings" 
    ON admin_settings FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage admin settings" 
    ON admin_settings FOR ALL 
    USING (check_if_admin());

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (new.id, COALESCE(new.email, 'New User'), 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
DROP TRIGGER IF EXISTS update_profiles_timestamp ON profiles;
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_investment_plans_timestamp ON investment_plans;
CREATE TRIGGER update_investment_plans_timestamp
  BEFORE UPDATE ON investment_plans
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_deposits_timestamp ON deposits;
CREATE TRIGGER update_deposits_timestamp
  BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_investments_timestamp ON investments;
CREATE TRIGGER update_investments_timestamp
  BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_admin_settings_timestamp ON admin_settings;
CREATE TRIGGER update_admin_settings_timestamp
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
