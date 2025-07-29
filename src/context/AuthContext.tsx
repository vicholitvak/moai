"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebaseConfig';

export interface UserProfile {
  uid: string;
  email?: string;
  name: string;
  role: 'client' | 'cooker' | 'delivery' | 'admin';
  phone?: string;
  address?: {
    fullAddress: string;
    lat: number;
    lng: number;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // This effect handles the entire authentication lifecycle.
  useEffect(() => {
    let unsubscribeProfile: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      // Unsubscribe from any previous profile listener when auth state changes.
      unsubscribeProfile();

      if (authUser) {
        // User is signed in.
        setUser(authUser);

        // Set session cookie for server-side protection
        try {
          const token = await authUser.getIdToken();
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
        } catch (error) {
          console.error("Failed to set session cookie:", error);
        }

        // Now, listen for the user's profile
        unsubscribeProfile = onSnapshot(
          doc(firestore, 'users', authUser.uid),
          (doc) => {
            if (doc.exists()) {
              setUserProfile({ uid: doc.id, ...doc.data() } as UserProfile);
            } else {
              console.error(`Profile not found for user: ${authUser.uid}`);
              setUserProfile(null);
            }
            setLoading(false); // Loading is complete
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
            setLoading(false);
          }
        );
      } else {
        // User is signed out.
        setUser(null);
        setUserProfile(null);
        // Clear the session cookie
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
          console.error("Failed to clear session cookie:", error);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will handle clearing user state and session cookie.
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }, []);

  const value = { user, userProfile, loading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};