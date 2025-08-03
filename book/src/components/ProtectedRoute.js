// client/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Optionally, render a loading spinner or message while checking auth status
        return <div>Loading authentication...</div>;
    }

    if (!isAuthenticated) {
        // User is not authenticated, redirect to login page
        return <Navigate to="/login" replace />;
    }

    // User is authenticated, render the child components (the protected content)
    return children;
};

export default ProtectedRoute;