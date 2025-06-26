import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Debug: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Checking...');
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [profileData, setProfileData] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [profilesTableExists, setProfilesTableExists] = useState<boolean | null>(null);

  useEffect(() => {
    // Log auth context state
    console.log('Debug page - Auth context state:', { user, profile, authLoading });
    
    // Check environment variables
    const vars = {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'Not set',
      SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'
    };
    setEnvVars(vars);

    // Check auth status
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          setAuthStatus(`Error: ${error.message}`);
          setSessionData(null);
        } else if (session) {
          console.log('Auth session found:', session);
          setAuthStatus('Authenticated');
          setSessionData(session);
          
          // Try to get profile directly
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Profile fetch error:', profileError);
            setProfileData({ error: profileError.message });
          } else {
            console.log('Profile data:', profileData);
            setProfileData(profileData);
          }
        } else {
          console.log('No auth session found');
          setAuthStatus('Not authenticated');
          setSessionData(null);
        }
      } catch (err) {
        console.error('Unexpected auth error:', err);
        setAuthStatus(`Unexpected error: ${String(err)}`);
      }
    };

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        // First check if profiles table exists
        const { data: tablesData, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'profiles');
          
        if (tablesError) {
          console.error('Table check error:', tablesError);
          setProfilesTableExists(null);
        } else {
          const exists = tablesData && tablesData.length > 0;
          console.log('Profiles table exists:', exists);
          setProfilesTableExists(exists);
        }
        
        // Now try to query profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
          
        if (error) {
          console.error('Supabase connection error:', error);
          setSupabaseStatus(`Error: ${error.message}`);
        } else {
          console.log('Supabase connection successful:', data);
          setSupabaseStatus('Connected successfully');
        }
      } catch (err) {
        console.error('Unexpected error testing Supabase:', err);
        setSupabaseStatus(`Unexpected error: ${String(err)}`);
      }
    };

    testSupabase();
    checkAuth();
  }, [user, profile, authLoading]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Page</h1>
      
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <pre className="bg-muted p-4 rounded overflow-auto text-sm">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>

        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Supabase Connection</h2>
          <div className={`p-4 rounded mb-4 ${
            supabaseStatus.includes('Error') ? 'bg-destructive/20' : 
            supabaseStatus === 'Connected successfully' ? 'bg-green-500/20' : 
            'bg-muted'
          }`}>
            <p><strong>Status:</strong> {supabaseStatus}</p>
          </div>
          <div className="mb-4">
            <p><strong>Profiles Table Exists:</strong> {profilesTableExists === null ? 'Unknown' : profilesTableExists ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        <div className={`p-4 rounded mb-4 ${
          authStatus.includes('Error') ? 'bg-destructive/20' : 
          authStatus === 'Authenticated' ? 'bg-green-500/20' : 
          'bg-muted'
        }`}>
          <p><strong>Status:</strong> {authStatus}</p>
          <p><strong>Auth Context Loading:</strong> {authLoading ? 'Yes' : 'No'}</p>
        </div>
        
        {sessionData && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Session Data</h3>
            <pre className="bg-muted p-4 rounded overflow-auto text-sm">
              {JSON.stringify({
                user_id: sessionData.user?.id,
                email: sessionData.user?.email,
                expires_at: sessionData.expires_at
              }, null, 2)}
            </pre>
          </div>
        )}
        
        {profileData && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Profile Data (Direct Query)</h3>
            <pre className="bg-muted p-4 rounded overflow-auto text-sm">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Auth Context Data</h3>
          <pre className="bg-muted p-4 rounded overflow-auto text-sm">
            {JSON.stringify({
              user_exists: !!user,
              user_id: user?.id,
              user_email: user?.email,
              profile_exists: !!profile,
              profile_data: profile ? {
                id: profile.id,
                name: profile.name,
                role: profile.role
              } : null
            }, null, 2)}
          </pre>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Browser Information</h2>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        <p><strong>Language:</strong> {navigator.language}</p>
        <p><strong>Window Size:</strong> {window.innerWidth}x{window.innerHeight}</p>
        <p><strong>Current URL:</strong> {window.location.href}</p>
      </div>
    </div>
  );
};

export default Debug;
