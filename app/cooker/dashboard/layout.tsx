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
      // No user, redirect to login
      router.push('/login');
    } else if (!loading && user && role !== null && role !== undefined && role !== 'Cooker' && !isAdmin) {
      // Only redirect if:
      // 1. Auth is done loading
      // 2. User exists
      // 3. Role is explicitly determined (not null or undefined)
      // 4. Role is not Cooker
      // 5. User is not admin
      console.log(`CookerLayout: Redirecting user with role ${role} to login`);
      router.push('/login');
    } else if (!loading && user && role === null && !isAdmin) {
      // Role is explicitly null after auth loading completed - this might be a new user
      // Allow dashboard to handle the onboarding flow instead of redirecting
      console.log('CookerLayout: Role is null but letting dashboard handle onboarding');
    }
  }, [user, role, loading, router, isAdmin]);

  if (loading || !user) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  // Allow access for Cookers, Admins, or users with null role (let dashboard handle onboarding)
  if (role !== 'Cooker' && role !== null && !isAdmin) {
    // Only block if role is explicitly not Cooker (and not null/undefined)
    return <div>Access denied. Please log in with a cooker account.</div>;
  }

  return <>{children}</>;
}
