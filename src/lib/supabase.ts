
// Re-export the supabase client from the integrations folder
export { supabase } from '@/integrations/supabase/client';

// Database types matching the actual schema
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  btc_wallet: string;
  usdt_wallet: string;
  role: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
  roi_percent: number;
  duration_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: 'BTC' | 'USDT';
  wallet_address: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  roi_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  plan?: InvestmentPlan;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'investment' | 'roi_return' | 'reinvestment';
  amount: number;
  description: string;
  created_at: string;
}
