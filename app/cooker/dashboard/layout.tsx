'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CookerLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // Check if user is admin
  const isAdmin = user?.email === 'admin@moai.com' || user?.uid === 'admin' || (user?.email && user.email.includes('admin'));

  useEffect(() => {
    if (!loading && user === null) {
      router.push('/login');
    } else if (!loading && user && role !== 'Cooker' && !isAdmin) {
      // Only redirect non-admin users who don't have Cooker role
      router.push('/login');
    }
  }, [user, role, loading, router, isAdmin]);

  if (loading || !user) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  // Allow access for Cookers or Admins
  if (role !== 'Cooker' && !isAdmin) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return <>{children}</>;
}
