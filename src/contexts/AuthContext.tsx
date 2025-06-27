import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
  btc_wallet?: string;
  usdt_wallet?: string;
}

interface AuthContextType {
  user: User | null;
  profile: User | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, btcWallet: string, usdtWallet: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { name: string; btc_wallet: string; usdt_wallet: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      setUser(response);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('AuthContext: Attempting signin for:', email);
      
      const response = await apiClient.signIn({ email, password });
      console.log('AuthContext: Signin response received:', response);
      
      apiClient.setToken(response.token);
      setUser(response.user);

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error: any) {
      console.error('AuthContext: Signin error:', error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Please check your email and password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, btcWallet: string, usdtWallet: string) => {
    try {
      setLoading(true);
      console.log('AuthContext: Attempting signup for:', email);
      
      const response = await apiClient.signUp({
        email,
        password,
        name,
        btcWallet,
        usdtWallet,
      });

      apiClient.setToken(response.token);
      setUser(response.user);

      toast({
        title: "Account Created!",
        description: "Welcome to InvestPro!",
      });
    } catch (error: any) {
      console.error('AuthContext: Signup error:', error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      apiClient.clearToken();
      setUser(null);

      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // This would typically send a reset email
      toast({
        title: "Password Reset",
        description: "Password reset functionality will be implemented with email service.",
      });
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProfile = async (data: { name: string; btc_wallet: string; usdt_wallet: string }) => {
    try {
      const response = await apiClient.updateProfile(data);
      setUser(response);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Profile Update Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('AuthContext: Initializing authentication...');
        const token = localStorage.getItem('auth_token');
        if (token) {
          console.log('AuthContext: Token found, verifying...');
          apiClient.setToken(token);
          const response = await apiClient.getCurrentUser();
          console.log('AuthContext: User verified:', response.user.email);
          setUser(response.user);
        } else {
          console.log('AuthContext: No token found');
        }
      } catch (error) {
        console.error('AuthContext: Auth initialization error:', error);
        apiClient.clearToken();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile: user, // For compatibility with existing code
      loading, 
      refreshProfile, 
      signIn, 
      signUp, 
      signOut, 
      resetPassword, 
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};