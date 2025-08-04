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
    // Register service worker on component mount
    if ('serviceWorker' in navigator) {
      // Small delay to not block initial page load
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js')
          .then(() => {
            console.log('Service Worker registered for notifications');
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      }, 1000);
    }
  }, []);

  // This component doesn't render anything
  return null;
}