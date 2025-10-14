'use client';

let googleMapsPromise: Promise<typeof google> | null = null;

export const loadGoogleMapsApi = (): Promise<typeof google> => {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps API can only be loaded in the browser'));
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps?.Geocoder) {
      resolve(window.google);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps]');

    if (existingScript) {
      // Wait for the API to be fully available
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.Geocoder) {
          clearInterval(checkLoaded);
          resolve(window.google);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google?.maps?.Geocoder) {
          reject(new Error('Google Maps API timeout'));
        }
      }, 10000);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      reject(new Error('Google Maps API key is not configured.'));
      return;
    }

    const script = document.createElement('script');
    // Updated to use loading=async for Places API (New) support
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async&language=es`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';

    script.onload = () => {
      // Wait for Geocoder to be available
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.Geocoder) {
          clearInterval(checkLoaded);
          resolve(window.google);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!window.google?.maps?.Geocoder) {
          reject(new Error('Google Maps API timeout'));
        }
      }, 10000);
    };

    script.onerror = () => reject(new Error('Google Maps script failed to load.'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};


