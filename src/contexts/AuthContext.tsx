
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
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('AuthContext: Fetching profile for user ID:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('AuthContext: Profile fetch error:', profileError);
        
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
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
    }
  };

  const signUp = async (email: string, password: string, name: string, btcWallet: string, usdtWallet: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            btc_wallet: btcWallet,
            usdt_wallet: usdtWallet,
          },
          emailRedirectTo: `${window.location.origin}/`
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
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      throw error;
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

      // Refresh profile after update
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

    const initAuth = async () => {
      if (initialized) return;

      try {
        console.log('AuthContext: Initializing auth state');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Session error:', error);
        } else if (session?.user && mounted) {
          console.log('AuthContext: Session found, setting user');
          setUser(session.user);
          
          // Fetch profile for the authenticated user
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        }

        if (mounted) {
          setInitialized(true);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('AuthContext: Auth state changed', { event, hasUser: !!session?.user });

      if (session?.user) {
        setUser(session.user);
        
        // Only fetch profile if we don't have one or if the user changed
        if (!profile || profile.user_id !== session.user.id) {
          console.log('AuthContext: Fetching profile for auth change');
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }

      if (mounted) {
        setLoading(false);
      }
    });

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('AuthContext: Safety timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 3000);

    return () => {
      console.log('AuthContext: Cleaning up');
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [initialized, profile, loading]);

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
