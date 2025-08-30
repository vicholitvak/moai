import { Suspense } from 'react';
import MonitoringDashboard from '@/components/MonitoringDashboard';
import { Card, CardContent } from '@/components/ui/card';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<MonitoringDashboardSkeleton />}>
        <MonitoringDashboard />
      </Suspense>
    </div>
  );
}

function MonitoringDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-64 animate-pulse" />
                </div>
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
