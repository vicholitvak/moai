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
          
          // Improved retry logic with exponential backoff for both new and existing users
          let docSnap = await getDoc(docRef);
          let retries = 0;
          const maxRetries = isAdminUser ? 2 : 5; // More retries for regular users
          
          while (!docSnap.exists() && retries < maxRetries) {
            // Exponential backoff: 500ms, 1s, 2s, 4s, 8s
            const delay = Math.min(500 * Math.pow(2, retries), 8000);
            console.log(`AuthContext: Retrying user document fetch (${retries + 1}/${maxRetries}) after ${delay}ms for ${user.email}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            docSnap = await getDoc(docRef);
            retries++;
          }
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            let userRole = userData.role;
            
            // If user is admin but role is not Admin, set it to Admin
            if (isAdminUser && userRole !== 'Admin') {
              userRole = 'Admin';
              await setDoc(docRef, { role: 'Admin' }, { merge: true });
            }
            
            setRole(userRole);
            console.log(`AuthContext: User ${user.email} has role: ${userRole}`);
          } else {
            // Handle missing user documents
            if (isAdminUser) {
              // Admin users always get Admin role
              await setDoc(docRef, { role: 'Admin' }, { merge: true });
              setRole('Admin');
              console.log(`AuthContext: Created Admin role for ${user.email}`);
            } else {
              // For regular users, be more careful about setting null role
              // This could be a network issue or existing user with temporarily missing doc
              console.warn(`AuthContext: User ${user.email} document not found after ${retries} retries. This may indicate a network issue or missing registration.`);
              
              // Keep loading state a bit longer to avoid race conditions
              // Only set role to null after a significant delay to allow other components to load properly
              setTimeout(() => {
                setRole(null);
                console.log(`AuthContext: Set role to null for ${user.email} after extended wait`);
              }, 2000); // 2 second delay before setting null role
              
              // For now, don't set role immediately to prevent premature onboarding triggers
              return; // Exit early to keep role as null but delay the setting
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