'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminVerifyPage() {
  const { user, role, loading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentData, setCurrentData] = useState<Record<string, unknown> | null>(null);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setCurrentData(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  const setAdminRole = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { role: 'Admin' }, { merge: true });
      
      toast.success('Admin role set successfully! Please refresh the page.');
      await loadUserData();
    } catch (error) {
      console.error('Error setting admin role:', error);
      toast.error('Failed to set admin role');
    } finally {
      setIsUpdating(false);
    }
  };

  const isAdminEmail = user?.email === 'admin@moai.com' || user?.uid === 'admin' || (user?.email && user.email.includes('admin'));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moai-orange"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Not Authenticated</h2>
            <p>Please log in to verify admin access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Verification & Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Current User Info</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>UID:</strong> {user.uid}</div>
                  <div><strong>Display Name:</strong> {user.displayName || 'Not set'}</div>
                  <div><strong>Current Role:</strong> 
                    <Badge className="ml-2" variant={role === 'Admin' ? 'default' : 'secondary'}>
                      {role || 'Loading...'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Admin Status</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Is Admin Email:</strong> 
                    <Badge className="ml-2" variant={isAdminEmail ? 'default' : 'secondary'}>
                      {isAdminEmail ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div><strong>Has Admin Role:</strong> 
                    <Badge className="ml-2" variant={role === 'Admin' ? 'default' : 'secondary'}>
                      {role === 'Admin' ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {currentData && (
              <div>
                <h3 className="font-semibold mb-2">Database Data</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(currentData, null, 2)}
                </pre>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Actions</h3>
              <div className="flex gap-2">
                {isAdminEmail && role !== 'Admin' && (
                  <Button 
                    onClick={setAdminRole}
                    disabled={isUpdating}
                    className="bg-moai-orange hover:bg-moai-orange/90"
                  >
                    {isUpdating ? 'Setting...' : 'Set Admin Role'}
                  </Button>
                )}
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Refresh Page
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/admin/dashboard'}
                  variant="outline"
                >
                  Go to Admin Dashboard
                </Button>
              </div>
            </div>

            {role === 'Admin' && (
              <div className="bg-green-50 border border-green-200 p-3 rounded">
                <p className="text-green-800 text-sm">
                  ✅ You have admin access! You should be able to access the admin dashboard.
                </p>
              </div>
            )}

            {isAdminEmail && role !== 'Admin' && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-yellow-800 text-sm">
                  ⚠️ You have an admin email but your role is not set to Admin. Click &quot;Set Admin Role&quot; above.
                </p>
              </div>
            )}

            {!isAdminEmail && (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <p className="text-red-800 text-sm">
                  ❌ Your email is not recognized as an admin email. Contact the system administrator.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}