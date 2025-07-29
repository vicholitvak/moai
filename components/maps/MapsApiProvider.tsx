'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';

interface MapsApiContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const MapsApiContext = createContext<MapsApiContextType>({
  isLoaded: false,
  loadError: undefined,
});

// Define the libraries you need here. `places` is essential for Autocomplete.
const libraries: Libraries = ['places'];

export function MapsApiProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // A robust check to ensure the API key is present.
  // This provides a clear error during development if the key is missing.
  if (!apiKey) {
    console.error("FATAL: Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.");
    return <>{children}</>; // Render children without map functionality
  }

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  return (
    <MapsApiContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapsApiContext.Provider>
  );
}

/**
 * Custom hook to easily access the Maps API loading status.
 */
export function useMapsApi() {
  return useContext(MapsApiContext);
}
