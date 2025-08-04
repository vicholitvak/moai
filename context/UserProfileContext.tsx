'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserProfileService } from '@/lib/services/userProfileService';
import type { UserProfile } from '@/lib/services/userProfileService';

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  isProfileComplete: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType>({
  profile: null,
  loading: true,
  isProfileComplete: false,
  updateProfile: async () => false,
  refreshProfile: async () => {}
});

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userProfile = await UserProfileService.getOrCreateProfile(
        user.uid,
        user.email || '',
        user.displayName || user.email || 'Usuario'
      );
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await UserProfileService.updateUserProfile(user.uid, updates);
      if (success) {
        await refreshProfile();
      }
      return success;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile();
    }
  };

  const isProfileComplete = profile?.isProfileComplete || false;

  return (
    <UserProfileContext.Provider 
      value={{
        profile,
        loading,
        isProfileComplete,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};