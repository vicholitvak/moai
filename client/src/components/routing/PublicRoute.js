import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>; // Or a loading spinner component
    }

    if (isAuthenticated) {
        // Redirect to the appropriate dashboard based on user role
        const dashboardPath = user?.role === 'cook' ? '/cook/dashboard' : '/customer/dashboard';
        return <Navigate to={dashboardPath} replace />;
    }

    return children;
};

export default PublicRoute;