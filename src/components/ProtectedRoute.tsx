
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

  if (loading) {
    console.log('ProtectedRoute: Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (adminOnly && profile && profile.role !== 'admin') {
    console.log('ProtectedRoute: Not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('ProtectedRoute: Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
