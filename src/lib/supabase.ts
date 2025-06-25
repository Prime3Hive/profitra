
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  btc_wallet?: string;
  usdt_wallet?: string;
  role: 'user' | 'admin';
  balance: number;
  created_at: string;
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
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  currency: 'BTC' | 'USDT';
  status: 'pending' | 'confirmed' | 'rejected';
  request_date: string;
  confirmed_date?: string;
  confirmed_by?: string;
  transaction_hash?: string;
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
  is_reinvestment: boolean;
  plan?: InvestmentPlan;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'investment' | 'roi_return' | 'reinvestment';
  amount: number;
  description: string;
  created_at: string;
  investment_id?: string;
  deposit_id?: string;
}
