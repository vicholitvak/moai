"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <p>Loading your dashboard...</p>
  </div>
);

export default function DashboardRedirectPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state is fully loaded
    }

    if (!userProfile) {
      // This case might happen if the user is logged out or profile doesn't exist
      router.replace('/login');
      return;
    }

    // Check if the profile is incomplete
    if (!userProfile.phone || !userProfile.address) {
      router.replace('/profile/setup');
    } else {
      // Profile is complete, redirect based on role
      if (userProfile.role === 'cooker') {
        router.replace('/cooks/orders');
      } else {
        router.replace('/dishes'); // Default for clients and others
      }
    }
  }, [userProfile, loading, router]);

  return <LoadingScreen />;
}