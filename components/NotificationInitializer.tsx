'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

export default function NotificationInitializer() {
  const { user } = useAuth();
  
  // Initialize order notifications for authenticated users
  useOrderNotifications({
    enabled: !!user, // Only enable for logged-in users
    enabledStatuses: ['accepted', 'preparing', 'ready', 'delivering', 'delivered']
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setTimeout(() => {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
          .then(() => {
            console.log('FCM Service Worker registered');
          })
          .catch((error) => {
            console.error('FCM Service Worker registration failed:', error);
          });
      }, 1000);
    }
  }, []);

  // This component doesn't render anything
  return null;
}