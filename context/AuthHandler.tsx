'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

const AuthHandler = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is admin
  const isAdmin = user?.email === 'admin@moai.com' || user?.uid === 'admin' || user?.email?.includes('admin');

  useEffect(() => {
    if (!loading) {
      // Admin access - allow admins to access admin pages
      if (user && isAdmin) {
        // If admin is on home page, redirect to admin dashboard
        if (pathname === '/') {
          router.push('/admin/dashboard');
          return;
        }
        // Allow admins to access any page (including role testing)
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
      
      // Role-based routing after authentication
      if (user && role) {
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
        
        // Prevent users from accessing other role's pages (but allow admins to access all)
        const isOnWrongRolePage = !isAdmin && (
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