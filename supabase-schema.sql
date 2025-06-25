
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

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

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for investment_plans
CREATE POLICY "Anyone can view active plans" ON investment_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON investment_plans FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for deposits
CREATE POLICY "Users can view own deposits" ON deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deposits" ON deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposits" ON deposits FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for investments
CREATE POLICY "Users can view own investments" ON investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create investments" ON investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all investments" ON investments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON transactions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS Policies for admin_settings
CREATE POLICY "Admins can manage settings" ON admin_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_investment_plans BEFORE UPDATE ON investment_plans FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_deposits BEFORE UPDATE ON deposits FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_investments BEFORE UPDATE ON investments FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_admin_settings BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_end_date ON investments(end_date);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_investment_plans_active ON investment_plans(is_active);

-- Function to complete investments and credit returns
CREATE OR REPLACE FUNCTION complete_matured_investments()
RETURNS void AS $$
BEGIN
    -- Update investments that have matured
    UPDATE investments 
    SET status = 'completed'
    WHERE status = 'active' 
    AND end_date <= NOW();
    
    -- Credit returns to user balances
    UPDATE profiles 
    SET balance = balance + i.roi_amount
    FROM investments i
    WHERE profiles.user_id = i.user_id
    AND i.status = 'completed'
    AND i.updated_at >= NOW() - INTERVAL '1 minute'; -- Only process recently completed
    
    -- Create transaction records for completed investments
    INSERT INTO transactions (user_id, type, amount, description, investment_id)
    SELECT 
        i.user_id,
        'roi_return',
        i.roi_amount,
        'ROI return from ' || p.name || ' investment',
        i.id
    FROM investments i
    JOIN investment_plans p ON i.plan_id = p.id
    WHERE i.status = 'completed'
    AND i.updated_at >= NOW() - INTERVAL '1 minute'
    AND NOT EXISTS (
        SELECT 1 FROM transactions t 
        WHERE t.investment_id = i.id 
        AND t.type = 'roi_return'
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, role, balance)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'user', 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
