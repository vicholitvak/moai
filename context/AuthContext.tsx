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
            // For new users or users without a document
            if (isAdminUser) {
              // Admin users always get Admin role
              await setDoc(docRef, { role: 'Admin' }, { merge: true });
              setRole('Admin');
            } else {
              // Don't automatically create a document for non-admin users
              // The SignUpModal will handle creating the document with the correct role
              // For now, don't set a role - this will prevent incorrect redirections
              setRole(null);
              console.log('User document not found in Firestore. User may need to complete registration.');
            }
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
          // Don't assign a default role - let the user complete registration if needed
          setRole(isAdminUser ? 'Admin' : null);
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