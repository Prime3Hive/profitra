-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'USDT')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    wallet_address TEXT NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    processed_date TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    transaction_hash TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies for withdrawals table
CREATE POLICY "Users can view their own withdrawals" 
    ON withdrawals FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawals" 
    ON withdrawals FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" 
    ON withdrawals FOR SELECT 
    USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update all withdrawals" 
    ON withdrawals FOR UPDATE 
    USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin');

-- Create trigger for timestamp updates
CREATE TRIGGER update_withdrawals_timestamp
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Update transactions table type check to include withdrawal_request and withdrawal_processed
ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('deposit', 'investment', 'roi_return', 'reinvestment', 'withdrawal_request', 'withdrawal_processed'));
