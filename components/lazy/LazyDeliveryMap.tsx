'use client';

import { createLazyComponent } from '@/components/ui/lazy-wrapper';
import { Loader2, Navigation } from 'lucide-react';

// Custom loading component for delivery maps
const DeliveryMapLoading = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-blue-50 rounded-lg">
    <div className="flex items-center space-x-2">
      <Navigation className="h-6 w-6 text-blue-500" />
      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    </div>
    <p className="text-sm text-muted-foreground">Cargando mapa de entrega...</p>
  </div>
);

// Lazy-loaded delivery map
export const LazyDeliveryMap = createLazyComponent(
  () => import('@/components/DeliveryMap'),
  <DeliveryMapLoading />
);

// Lazy-loaded live delivery map
export const LazyLiveDeliveryMap = createLazyComponent(
  () => import('@/components/LiveDeliveryMap'),
  <DeliveryMapLoading />
);