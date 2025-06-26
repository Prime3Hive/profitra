import { createClient } from '@supabase/supabase-js';

// Log environment variables to help debug
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Environment Variables:', { 
  supabaseUrl: supabaseUrl || 'NOT SET', 
  supabaseAnonKey: supabaseAnonKey ? 'SET (value hidden)' : 'NOT SET'
});

// Check if we have valid values
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase environment variables! Application may not work correctly.');
  console.error('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Fallback values for development only (not for production)
// These are placeholders and will likely fail if environment variables are not set
const fallbackUrl = 'https://your-project.supabase.co';
const fallbackKey = 'your-anon-key';

// Use environment variables with fallbacks
const url = supabaseUrl || fallbackUrl;
const key = supabaseAnonKey || fallbackKey;

// Create the Supabase client
let supabaseInstance;
try {
  supabaseInstance = createClient(url, key);
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a dummy client that will log errors instead of crashing
  supabaseInstance = createClient('https://example.com', 'dummy-key');
  console.warn('Created fallback Supabase client - functionality will be limited');
}

// Export the client
export const supabase = supabaseInstance;

// Database types matching the actual schema
export interface Profile {
  id: string;
  user_id: string; // Added explicit user_id property
  name: string;
  btc_wallet: string;
  usdt_wallet: string;
  role: string; // Changed from is_admin: boolean to role: string to match AuthContext
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