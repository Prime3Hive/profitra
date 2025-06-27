
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, btcWallet: string, usdtWallet: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
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
  const { toast } = useToast();

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('AuthContext: Fetching profile for user ID:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('AuthContext: Profile fetch error:', profileError);
        // Try to create profile if it doesn't exist
        if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows found')) {
          console.log('AuthContext: Profile not found, creating new profile');
          
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
            console.error('AuthContext: Profile creation error:', createError);
            return null;
          }

          console.log('AuthContext: Profile created successfully:', newProfile);
          return newProfile;
        }
        return null;
      }

      if (!profileData) {
        console.log('AuthContext: No profile found, creating new profile');
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
          console.error('AuthContext: Profile creation error:', createError);
          return null;
        }

        console.log('AuthContext: Profile created successfully:', newProfile);
        return newProfile;
      }

      console.log('AuthContext: Profile fetched successfully:', profileData);
      return profileData;
    } catch (error) {
      console.error('AuthContext: Unexpected error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) {
      console.log('AuthContext: No user ID available for profile refresh');
      return;
    }

    console.log('AuthContext: Refreshing profile for user:', user.id);
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, btcWallet: string, usdtWallet: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            btc_wallet: btcWallet,
            usdt_wallet: usdtWallet,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Account Created!",
        description: "Please check your email to confirm your account.",
      });
    } catch (error) {
      console.error('AuthContext: Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // Clear state immediately
      setUser(null);
      setProfile(null);

      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Password Reset Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      console.error('AuthContext: Password reset error:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user?.id) {
      throw new Error('No user logged in');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Profile Update Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      await refreshProfile();

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('AuthContext: Profile update error:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        console.log('AuthContext: Initializing auth state');
        
        // Set up auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          console.log('AuthContext: Auth state changed', { event, hasUser: !!session?.user });

          if (session?.user) {
            setUser(session.user);
            
            // Fetch profile for the user
            try {
              const profileData = await fetchProfile(session.user.id);
              if (mounted) {
                setProfile(profileData);
                setLoading(false);
              }
            } catch (error) {
              console.error('AuthContext: Error fetching profile on auth change:', error);
              if (mounted) {
                setProfile(null);
                setLoading(false);
              }
            }
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        });

        authSubscription = subscription;

        // Then check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Session error:', error);
          if (mounted) {
            setLoading(false);
          }
        } else if (session?.user && mounted) {
          console.log('AuthContext: Existing session found');
          setUser(session.user);
          
          try {
            const profileData = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(profileData);
            }
          } catch (error) {
            console.error('AuthContext: Error fetching profile on init:', error);
            if (mounted) {
              setProfile(null);
            }
          }
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Init error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      console.log('AuthContext: Cleaning up');
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
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
