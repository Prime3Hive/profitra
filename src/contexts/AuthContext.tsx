
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
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
  const [initialized, setInitialized] = useState(false);

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
              balance: 0
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
    }, 3000); // Reduced to 3 seconds

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [initialized, profile, loading]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
