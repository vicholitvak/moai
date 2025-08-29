'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Activity, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { monitoring } from '@/lib/services/monitoringService';
import { useAuth } from '@/context/AuthContext';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

interface ErrorLog {
  id: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
}

export default function MonitoringDashboard() {
  const { role } = useAuth();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading metrics (in real app, this would come from an API)
      const mockMetrics: MetricCard[] = [
        {
          title: 'Active Users',
          value: '1,234',
          change: '+12%',
          icon: <Users className="h-4 w-4" />,
          trend: 'up',
        },
        {
          title: 'Orders Today',
          value: '89',
          change: '+8%',
          icon: <Activity className="h-4 w-4" />,
          trend: 'up',
        },
        {
          title: 'Revenue',
          value: '$12,345',
          change: '+15%',
          icon: <DollarSign className="h-4 w-4" />,
          trend: 'up',
        },
        {
          title: 'Avg Response Time',
          value: '245ms',
          change: '-5%',
          icon: <Clock className="h-4 w-4" />,
          trend: 'down',
        },
      ];

      const mockErrors: ErrorLog[] = [
        {
          id: '1',
          message: 'Firebase connection timeout',
          level: 'warning',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          userId: 'user123',
          context: { endpoint: '/api/orders' },
        },
        {
          id: '2',
          message: 'Payment processing failed',
          level: 'error',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          userId: 'user456',
          context: { paymentMethod: 'mercadopago' },
        },
      ];

      setMetrics(mockMetrics);
      setErrors(mockErrors);
    } catch (error) {
      monitoring.trackError(error as Error, { component: 'MonitoringDashboard' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    monitoring.trackUserAction('dashboard_refresh', 'monitoring_dashboard');
    loadDashboardData();
  };

  const handleErrorResolve = (errorId: string) => {
    monitoring.trackUserAction('error_resolve', 'monitoring_dashboard', { errorId });
    setErrors(prev => prev.filter(error => error.id !== errorId));
  };

  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">
            Solo los administradores pueden acceder al dashboard de monitoreo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Monitoreo</h1>
          <p className="text-muted-foreground">
            Métricas en tiempo real y monitoreo de errores
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <p className={`text-xs ${
                  metric.trend === 'up' ? 'text-green-600' :
                  metric.trend === 'down' ? 'text-red-600' :
                  'text-muted-foreground'
                }`}>
                  {metric.change} desde ayer
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Monitoring */}
      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Errores</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Errores Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay errores recientes. ¡Excelente!
                </p>
              ) : (
                <div className="space-y-4">
                  {errors.map((error) => (
                    <div key={error.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            error.level === 'error' ? 'destructive' :
                            error.level === 'warning' ? 'secondary' :
                            'outline'
                          }>
                            {error.level}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {error.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium">{error.message}</p>
                        {error.context && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {JSON.stringify(error.context)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleErrorResolve(error.id)}
                      >
                        Resolver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">API Response Times</h4>
                    <p className="text-2xl font-bold text-green-600">245ms</p>
                    <p className="text-sm text-muted-foreground">Promedio</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Error Rate</h4>
                    <p className="text-2xl font-bold text-red-600">0.12%</p>
                    <p className="text-sm text-muted-foreground">Últimas 24h</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">1,234</p>
                    <p className="text-sm text-muted-foreground">Usuarios Activos</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">89</p>
                    <p className="text-sm text-muted-foreground">Pedidos Hoy</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">4.8</p>
                    <p className="text-sm text-muted-foreground">Rating Promedio</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
