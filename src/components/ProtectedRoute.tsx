
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

  console.log('ProtectedRoute: Render state', { 
    loading, 
    hasUser: !!user, 
    hasProfile: !!profile,
    profileRole: profile?.role,
    adminOnly
  });

  // If we're still loading, show the spinner (with reduced timeout handled in AuthContext)
  if (loading) {
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
  
  // If there's no user, redirect to signin
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // For admin routes, check if profile exists and has admin role
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

  // For non-admin routes, allow access even if profile is still loading
  // The user is authenticated, that's what matters for basic access
  console.log('ProtectedRoute: Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
