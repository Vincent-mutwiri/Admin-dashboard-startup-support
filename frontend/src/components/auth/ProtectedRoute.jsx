import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// This component will wrap our protected pages
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // While the auth state is loading, we don't render anything.
  // This prevents a flicker from the protected page to the login page.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If there's no user, redirect to the login page.
  // We pass the current location in the state, so we can redirect back after login.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If there is a user, render the child components (the actual page).
  return children;
};

export default ProtectedRoute;
