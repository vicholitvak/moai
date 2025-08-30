'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RoleSwitcher = () => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const switchRole = async (newRole: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: newRole });
      
      // Navigate directly to the appropriate dashboard with full page reload
      let targetUrl = '/dishes'; // default
      switch (newRole) {
        case 'Client':
          targetUrl = '/dishes';
          break;
        case 'Cooker':
          targetUrl = '/cooker/dashboard';
          break;
        case 'Driver':
          targetUrl = '/driver/dashboard';
          break;
        default:
          targetUrl = '/dishes';
      }
      
      // Use window.location.href for full page navigation to ensure auth context refresh
      window.location.href = targetUrl;
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Role Switcher (Testing)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Current Role: <strong>{role}</strong></p>
        <div className="space-y-2">
          <Button 
            onClick={() => switchRole('Client')} 
            disabled={loading || role === 'Client'}
            className="w-full"
          >
            Switch to Client
          </Button>
          <Button 
            onClick={() => switchRole('Cooker')} 
            disabled={loading || role === 'Cooker'}
            className="w-full"
          >
            Switch to Cooker
          </Button>
          <Button 
            onClick={() => switchRole('Driver')} 
            disabled={loading || role === 'Driver'}
            className="w-full"
          >
            Switch to Driver
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleSwitcher;