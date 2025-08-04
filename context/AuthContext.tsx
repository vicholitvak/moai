'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../lib/firebase/client';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  role: null, 
  loading: true, 
  logout: async () => {} 
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
          
          // Check if user is admin by email or UID
          const isAdminUser = user.email === 'admin@moai.com' || user.uid === 'admin' || (user.email && user.email.includes('admin'));
          
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            let userRole = userData.role;
            
            // If user is admin but role is not Admin, set it to Admin
            if (isAdminUser && userRole !== 'Admin') {
              userRole = 'Admin';
              await setDoc(docRef, { role: 'Admin' }, { merge: true });
            }
            
            setRole(userRole);
          } else {
            // New user - check if admin or assign default Client role
            const defaultRole = isAdminUser ? 'Admin' : 'Client';
            await setDoc(docRef, { role: defaultRole }, { merge: true });
            setRole(defaultRole);
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // Set user but don't crash the app
        if (user) {
          setUser(user);
          const isAdminUser = user.email === 'admin@moai.com' || user.uid === 'admin' || (user.email && user.email.includes('admin'));
          setRole(isAdminUser ? 'Admin' : 'Client'); // Default role if Firestore fails
        } else {
          setUser(null);
          setRole(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear any session cookies by calling the logout API
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (apiError) {
        // API logout failed but Firebase logout succeeded - this is okay
        console.warn('API logout failed, but Firebase logout succeeded:', apiError);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);