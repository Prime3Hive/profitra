
import { createClient } from '@supabase/supabase-js';

// Use the actual Supabase project URL and anon key
const supabaseUrl = 'https://zkswcwwjnsrvpqxnqdbm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprc3djd3dqbnNydnBxeG5xZGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDI5OTcsImV4cCI6MjA2NTk3ODk5N30.qMPlpBz79xMiRJFo3SFs6L0bm7hA9ggRuUmWeDoea_g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types matching the actual schema
export interface Profile {
  id: string;
  name: string;
  btc_wallet: string;
  usdt_wallet: string;
  is_admin: boolean;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  min_amount: number;
  max_amount: number;
  roi: number;
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
  roi: number;
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
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}
