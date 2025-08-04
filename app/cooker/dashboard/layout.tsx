'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CookerLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (user === null || role !== 'Cooker')) {
      router.push('/login');
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== 'Cooker') {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return <>{children}</>;
}
