import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// This component will wrap our protected pages
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  // While the auth state is loading, we don't render anything.
  // This prevents a flicker from the protected page to the login page.
  if (isLoading) {
    return null; // Or a loading spinner component
  }

  // If there's no user, redirect to the login page.
  // The 'replace' prop prevents the user from going back to the protected route with the browser's back button.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If there is a user, render the child components (the actual page).
  return children;
};

export default ProtectedRoute;
