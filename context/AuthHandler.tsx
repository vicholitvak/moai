'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

const AuthHandler = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is admin - with null safety
  const isAdmin = user?.email === 'admin@moai.com' || user?.uid === 'admin' || (user?.email && user.email.includes('admin'));

  useEffect(() => {
    if (!loading) {

      // Admin access - allow admins to access admin pages
      if (user && isAdmin) {
        // If admin is on home page, redirect to admin dashboard by default
        if (pathname === '/') {
          router.push('/admin/dashboard');
          return;
        }
        
        // If accessing admin routes, always allow
        if (pathname.startsWith('/admin')) {
          return;
        }
        
        // If admin has switched to a specific role and is accessing that role's pages, allow it
        if (role && role !== 'Admin' && role !== 'admin') {
          const effectiveRole = role;
          const isOnCorrectRolePage = (
            (effectiveRole === 'Client' && (pathname.startsWith('/client') || pathname.startsWith('/dishes'))) ||
            (effectiveRole === 'Cooker' && pathname.startsWith('/cooker')) ||
            (effectiveRole === 'Driver' && pathname.startsWith('/driver'))
          );
          
          if (isOnCorrectRolePage) {
            return; // Allow access to switched role pages
          }
        }
        
        // For all other cases, admins can access any page
        return;
      }
      
      // Block non-admin users from accessing admin pages
      if (!isAdmin && pathname.startsWith('/admin')) {
        router.push('/');
        return;
      }
      
      // If user is authenticated but has no role, assign default Client role
      if (user && !role) {
        // Default new users to Client role - they can change later if needed
        return;
      }
      
      // If user is not authenticated and not on public pages, send to home
      if (!user && pathname !== '/' && pathname !== '/login') {
        router.push('/');
        return;
      }
      
      // Role-based routing after authentication (only for non-admin users)
      if (user && role && !isAdmin) {
        // Redirect from home page to appropriate dashboard after sign-in
        if (pathname === '/') {
          switch (role) {
            case 'Client':
              router.push('/dishes');
              break;
            case 'Cooker':
              router.push('/cooker/dashboard');
              break;
            case 'Driver':
              router.push('/driver/dashboard');
              break;
            default:
              // Fallback for unknown roles - default to Client dashboard
              router.push('/dishes');
          }
          return;
        }
        
        // Allow users to stay on their correct role pages without redirecting
        const isOnCorrectRolePage = (
          (role === 'Client' && (pathname.startsWith('/client') || pathname.startsWith('/dishes') || pathname === '/cart')) ||
          (role === 'Cooker' && pathname.startsWith('/cooker')) ||
          (role === 'Driver' && pathname.startsWith('/driver'))
        );
        
        // If user is already on correct page, don't redirect
        if (isOnCorrectRolePage) {
          return;
        }
        
        // Prevent non-admin users from accessing other role's pages
        const isOnWrongRolePage = (
          (role === 'Client' && (pathname.startsWith('/cooker') || pathname.startsWith('/driver'))) ||
          (role === 'Cooker' && (pathname.startsWith('/client') || pathname.startsWith('/driver'))) ||
          (role === 'Driver' && (pathname.startsWith('/client') || pathname.startsWith('/cooker')))
        );
        
        if (isOnWrongRolePage) {
          // Redirect to their appropriate dashboard
          switch (role) {
            case 'Client':
              router.push('/dishes');
              break;
            case 'Cooker':
              router.push('/cooker/dashboard');
              break;
            case 'Driver':
              router.push('/driver/dashboard');
              break;
          }
        }
      }
    }
  }, [user, role, loading, router, pathname, isAdmin]);

  return <>{children}</>;
};

export default AuthHandler;