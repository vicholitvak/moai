'use client';

import { createLazyComponent } from '@/components/ui/lazy-wrapper';
import { Loader2, BarChart3 } from 'lucide-react';

// Custom loading component for analytics
const AnalyticsLoading = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="flex items-center space-x-2">
      <BarChart3 className="h-6 w-6 text-blue-500" />
      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    </div>
    <p className="text-sm text-muted-foreground">Cargando análisis...</p>
  </div>
);

// Lazy-loaded analytics dashboard
export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('@/components/AnalyticsDashboard'),
  <AnalyticsLoading />
);