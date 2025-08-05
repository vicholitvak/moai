'use client';

import { createLazyComponent } from '@/components/ui/lazy-wrapper';
import { Loader2, MapPin } from 'lucide-react';

// Custom loading component for maps
const MapLoading = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-gray-50 rounded-lg">
    <div className="flex items-center space-x-2">
      <MapPin className="h-6 w-6 text-green-500" />
      <Loader2 className="h-6 w-6 animate-spin text-green-500" />
    </div>
    <p className="text-sm text-muted-foreground">Cargando mapa de seguimiento...</p>
  </div>
);

// Lazy-loaded driver tracking map
export const LazyDriverTrackingMap = createLazyComponent(
  () => import('@/components/DriverTrackingMap'),
  <MapLoading />
);