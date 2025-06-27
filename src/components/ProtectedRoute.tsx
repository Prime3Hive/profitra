
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

  console.log('ProtectedRoute: Current state', { 
    loading, 
    hasUser: !!user, 
    hasProfile: !!profile,
    profileRole: profile?.role,
    adminOnly,
    currentPath: location.pathname
  });

  // Show loading only while auth is being determined
  if (loading) {
    console.log('ProtectedRoute: Auth loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }
  
  // If no user, redirect to signin
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If user exists but no profile, show a loading state briefly
  // This handles the case where user is authenticated but profile is still being created
  if (!profile) {
    console.log('ProtectedRoute: User exists but no profile, showing brief loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
          <p className="text-sm text-muted-foreground">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Check admin permissions
  if (adminOnly && profile.role !== 'admin') {
    console.log('ProtectedRoute: Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('ProtectedRoute: All checks passed, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
