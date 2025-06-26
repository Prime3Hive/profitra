
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Profile {
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

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, btcWallet: string, usdtWallet: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing auth state');
    let isMounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      console.log('AuthContext: Session check complete', { hasSession: !!session });
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthContext: User found in session, fetching profile');
        fetchProfile(session.user.id);
      } else {
        console.log('AuthContext: No user in session, setting loading to false');
        setLoading(false);
      }
    }).catch(error => {
      if (!isMounted) return;
      console.error('AuthContext: Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      console.log('AuthContext: Auth state changed', { event, hasUser: !!session?.user });
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthContext: User found in auth change, fetching profile');
        await fetchProfile(session.user.id);
      } else {
        console.log('AuthContext: No user in auth change, clearing profile');
        setProfile(null);
        setLoading(false);
      }
    });

    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        console.log('AuthContext: Safety timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    return () => {
      console.log('AuthContext: Cleaning up');
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('AuthContext: Fetching profile for user ID:', userId);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { 
          console.log('AuthContext: No profile found, creating default profile');
          await createDefaultProfile(userId);
        } else {
          console.error('AuthContext: Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Failed to load user profile. Please try refreshing the page.",
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      if (profile) {
        console.log('AuthContext: Profile found:', profile);
        setProfile(profile);
      }
    } catch (error) {
      console.error('AuthContext: Error in fetchProfile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async (userId: string) => {
    console.log('AuthContext: Creating default profile for user');
    try {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId, 
          name: 'New User',
          role: 'user',
          balance: 0,
          btc_wallet: '',
          usdt_wallet: ''
        })
        .select()
        .single();

      if (createError) {
        console.error('AuthContext: Error creating default profile:', createError);
        toast({
          title: "Error",
          description: "Failed to create user profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('AuthContext: Default profile created:', newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('AuthContext: Error in createDefaultProfile:', error);
      toast({
        title: "Error",
        description: "Failed to create user profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const signUp = async (email: string, password: string, name: string, btcWallet: string, usdtWallet: string) => {
    try {
      console.log('AuthContext: Signing up new user with email:', email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
            btc_wallet: btcWallet,
            usdt_wallet: usdtWallet
          }
        }
      });

      if (authError) {
        console.error('AuthContext: Auth signup error:', authError);
        throw authError;
      }

      if (authData.user) {
        console.log('AuthContext: User created successfully');
        toast({
          title: "Success",
          description: "Account created successfully! Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      console.error('AuthContext: Signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Success",
        description: "Signed out successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent! Check your inbox.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('AuthContext: Updating profile for user ID:', user.id, 'with updates:', updates);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('AuthContext: Error updating profile:', error);
        throw error;
      }

      console.log('AuthContext: Profile updated successfully, refreshing profile');
      await refreshProfile();

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      console.error('AuthContext: Error in updateProfile:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
