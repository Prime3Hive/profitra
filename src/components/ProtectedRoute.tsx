
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  const [timeoutDuration] = React.useState(5000); // Reduced to 5 seconds

  console.log('ProtectedRoute: Render state', { 
    loading, 
    loadingTimeout, 
    hasUser: !!user, 
    hasProfile: !!profile,
    profileRole: profile?.role,
    adminOnly
  });

  // Set a timeout to prevent infinite loading
  React.useEffect(() => {
    console.log('ProtectedRoute: Loading state changed:', loading);
    if (loading) {
      console.log(`ProtectedRoute: Setting ${timeoutDuration}ms timeout`);
      const timer = setTimeout(() => {
        console.log('ProtectedRoute: Loading timeout reached');
        setLoadingTimeout(true);
      }, timeoutDuration);
      return () => {
        console.log('ProtectedRoute: Clearing timeout');
        clearTimeout(timer);
      };
    } else if (!loading && loadingTimeout) {
      // Reset timeout if loading completes
      console.log('ProtectedRoute: Loading completed, resetting timeout');
      setLoadingTimeout(false);
    }
  }, [loading, timeoutDuration]);

  // If we're still loading but not timed out, show the spinner
  if (loading && !loadingTimeout) {
    console.log('ProtectedRoute: Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If loading timed out or there's no user, redirect to signin
  if (loadingTimeout || !user) {
    console.log('ProtectedRoute: Redirecting to signin: timeout =', loadingTimeout, 'no user =', !user);
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // For admin routes, check if profile exists and has admin role
  // If profile doesn't exist yet but user does, proceed anyway (non-admin routes only)
  if (adminOnly) {
    if (!profile) {
      console.log('ProtectedRoute: No profile for admin check, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    
    if (profile.role !== 'admin') {
      console.log('ProtectedRoute: Not admin, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('ProtectedRoute: Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
