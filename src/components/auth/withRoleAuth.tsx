"use client";

import { useAuth, UserProfile } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';

// Define a loading component or import a skeleton loader
const LoadingScreen = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

/**
 * A Higher-Order Component to protect pages based on user role.
 * @param WrappedComponent The component to wrap.
 * @param allowedRoles An array of roles that are allowed to access the page.
 */
const withRoleAuth = <P extends object>(
  WrappedComponent: ComponentType<P>,
  allowedRoles: Array<UserProfile['role']>
) => {
  const ComponentWithAuth = (props: P) => {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.replace('/login');
        } else if (userProfile && !allowedRoles.includes(userProfile.role)) {
          // Redirect to a safe page if the role does not match
          router.replace('/dashboard'); // Or an '/access-denied' page
        }
      }
    }, [loading, user, userProfile, router]);

    if (loading || !user || (userProfile && !allowedRoles.includes(userProfile.role))) {
      return <LoadingScreen />;
    }

    return <WrappedComponent {...props} />;
  };

  return ComponentWithAuth;
};

export default withRoleAuth;