'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/enhanced-sw.js', {
            scope: '/'
          });

          console.log('Service Worker registered successfully:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast.info('Nueva versión disponible', {
                    description: 'Actualiza para obtener las últimas funciones',
                    action: {
                      label: 'Actualizar',
                      onClick: () => window.location.reload()
                    },
                    duration: 10000
                  });
                }
              });
            }
          });

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      // Register service worker after window load
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
      }
    }
  }, []);

  return null;
}