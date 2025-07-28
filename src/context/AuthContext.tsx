"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebaseConfig';
import { Loader } from 'lucide-react';

// Define a type for the user profile data from Firestore
export interface UserProfile extends DocumentData {
  uid: string;
  email: string; // This is the auth email, can be different from a contact email
  role: 'client' | 'cooker' | 'delivery';
  createdAt: Date;
  // Optional fields that can be added to the profile
  name?: string;
  phone?: string;
  // Cook-specific
  bankName?: string;
  accountNumber?: string;
  // Client-specific
  cardLastFour?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, fetch their profile from Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          // This case should not happen in a normal flow
          console.error("No user profile found in Firestore for UID:", user.uid);
          setUserProfile(null);
        }
        setUser(user);
      } else {
        // User is signed out, clear all data
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, userProfile, loading };

  // We don't show a loading spinner here to avoid a flash on page load.
  // Route protection will handle loading states.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};