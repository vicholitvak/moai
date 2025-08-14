'use client';

import { useState, useEffect } from 'react';
import { AnalyticsService, type SearchAnalytics, type DishAnalytics } from '@/lib/services/analyticsService';
import { DishesService, OrdersService } from '@/lib/firebase/dataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Search,
  Eye,
  ShoppingCart,
  Users,
  Clock,
  Star,
  DollarSign,
  Package,
  MousePointer,
  BarChart3,
  LineChart,
  PieChart,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AnalyticsDashboardProps {
  role?: 'admin' | 'cook' | 'driver';
  timeRange?: '7d' | '30d' | '90d';
  showRealTime?: boolean;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  description?: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>;
}

const AnalyticsDashboard = ({ 
  role = 'admin', 
  timeRange = '30d',
  showRealTime = true 
}: AnalyticsDashboardProps) => {
  const { user } = useAuth();
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [topDishes, setTopDishes] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'searches' | 'orders' | 'revenue' | 'users'>('searches');

  useEffect(() => {
    loadAnalytics();
    
    if (showRealTime) {
      const interval = setInterval(loadRealTimeStats, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, role]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      // Load search analytics
      const searchData = await AnalyticsService.getSearchAnalytics(days);
      setSearchAnalytics(searchData);

      // Load performance metrics based on role
      if (role === 'admin') {
        await loadAdminMetrics(days);
      } else if (role === 'cook') {
        await loadCookMetrics(days);
      } else if (role === 'driver') {
        await loadDriverMetrics(days);
      }

      // Load real-time stats
      await loadRealTimeStats();

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminMetrics = async (days: number) => {
    try {
      // Get top performing dishes
      const dishes = await DishesService.getAllDishes();
      const dishesWithMetrics = await Promise.all(
        dishes.slice(0, 10).map(async (dish) => {
          const analytics = await AnalyticsService.getDishAnalytics(dish.id);
          return { ...dish, analytics };
        })
      );
      
      setTopDishes(dishesWithMetrics.filter(d => d.analytics));

      // Calculate overall performance metrics
      const totalDishes = dishes.length;
      const activeDishes = dishes.filter(d => d.isAvailable).length;
      const averageRating = dishes.reduce((sum, d) => sum + d.rating, 0) / dishes.length || 0;

      setPerformanceMetrics({
        totalDishes,
        activeDishes,
        averageRating,
        conversionRate: 12.5, // Would be calculated from actual data
        totalRevenue: 1250000, // Would be calculated from orders
        totalOrders: 342
      });

    } catch (error) {
      console.error('Error loading admin metrics:', error);
    }
  };

  const loadCookMetrics = async (days: number) => {
    if (!user) return;
    
    try {
      // Get cook's dishes
      const dishes = await DishesService.getDishesByCook(user.uid);
      
      // Calculate cook-specific metrics
      const totalViews = 1250; // Would be calculated from analytics
      const totalOrders = 87;
      const revenue = 87500;
      const averageRating = dishes.reduce((sum, d) => sum + d.rating, 0) / dishes.length || 0;

      setPerformanceMetrics({
        totalDishes: dishes.length,
        activeDishes: dishes.filter(d => d.isAvailable).length,
        totalViews,
        totalOrders,
        revenue,
        averageRating,
        conversionRate: totalViews > 0 ? (totalOrders / totalViews) * 100 : 0
      });

      setTopDishes(dishes.slice(0, 5));

    } catch (error) {
      console.error('Error loading cook metrics:', error);
    }
  };

  const loadDriverMetrics = async (days: number) => {
    try {
      // Driver-specific metrics
      setPerformanceMetrics({
        totalDeliveries: 156,
        completedDeliveries: 152,
        averageDeliveryTime: 32,
        customerRating: 4.8,
        earnings: 125000,
        onTimeRate: 94.2
      });

    } catch (error) {
      console.error('Error loading driver metrics:', error);
    }
  };

  const loadRealTimeStats = async () => {
    try {
      const stats = await AnalyticsService.getRealTimeStats();
      setRealTimeStats(stats);
    } catch (error) {
      console.error('Error loading real-time stats:', error);
    }
  };

  const getMetricCards = (): MetricCard[] => {
    if (role === 'admin') {
      return [
        {
          title: 'Búsquedas Totales',
          value: searchAnalytics?.totalSearches || 0,
          change: 12.5,
          changeType: 'increase',
          icon: <Search className="h-4 w-4" />,
          description: 'Últimos 30 días'
        },
        {
          title: 'Conversión',
          value: `${searchAnalytics?.clickThroughRate.toFixed(1) || 0}%`,
          change: 2.3,
          changeType: 'increase',
          icon: <MousePointer className="h-4 w-4" />,
          description: 'CTR de búsquedas'
        },
        {
          title: 'Platos Activos',
          value: performanceMetrics?.activeDishes || 0,
          icon: <Package className="h-4 w-4" />,
          description: `${performanceMetrics?.totalDishes || 0} total`
        },
        {
          title: 'Rating Promedio',
          value: performanceMetrics?.averageRating?.toFixed(1) || '0.0',
          change: 0.2,
          changeType: 'increase',
          icon: <Star className="h-4 w-4" />,
          description: 'Todos los platos'
        }
      ];
    } else if (role === 'cook') {
      return [
        {
          title: 'Visualizaciones',
          value: performanceMetrics?.totalViews || 0,
          change: 15.2,
          changeType: 'increase',
          icon: <Eye className="h-4 w-4" />,
          description: 'Últimos 30 días'
        },
        {
          title: 'Pedidos',
          value: performanceMetrics?.totalOrders || 0,
          change: 8.7,
          changeType: 'increase',
          icon: <ShoppingCart className="h-4 w-4" />,
          description: 'Pedidos completados'
        },
        {
          title: 'Ingresos',
          value: `$${(performanceMetrics?.revenue || 0).toLocaleString('es-CL')}`,
          change: 22.1,
          changeType: 'increase',
          icon: <DollarSign className="h-4 w-4" />,
          description: 'Ingresos totales'
        },
        {
          title: 'Conversión',
          value: `${performanceMetrics?.conversionRate?.toFixed(1) || 0}%`,
          change: -1.2,
          changeType: 'decrease',
          icon: <TrendingUp className="h-4 w-4" />,
          description: 'Visitas a pedidos'
        }
      ];
    } else {
      return [
        {
          title: 'Entregas Completadas',
          value: performanceMetrics?.completedDeliveries || 0,
          change: 5.3,
          changeType: 'increase',
          icon: <Package className="h-4 w-4" />,
          description: `${performanceMetrics?.totalDeliveries || 0} total`
        },
        {
          title: 'Tiempo Promedio',
          value: `${performanceMetrics?.averageDeliveryTime || 0} min`,
          change: -2.1,
          changeType: 'increase',
          icon: <Clock className="h-4 w-4" />,
          description: 'Tiempo de entrega'
        },
        {
          title: 'Rating',
          value: performanceMetrics?.customerRating?.toFixed(1) || '0.0',
          change: 0.1,
          changeType: 'increase',
          icon: <Star className="h-4 w-4" />,
          description: 'Calificación promedio'
        },
        {
          title: 'Ganancias',
          value: `$${(performanceMetrics?.earnings || 0).toLocaleString('es-CL')}`,
          change: 18.5,
          changeType: 'increase',
          icon: <DollarSign className="h-4 w-4" />,
          description: 'Últimos 30 días'
        }
      ];
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getChartData = (): ChartData => {
    if (!searchAnalytics || !searchAnalytics.searchTrends) return { labels: [], datasets: [] };

    return {
      labels: searchAnalytics.searchTrends.map(trend => 
        new Date(trend.date).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Búsquedas',
          data: searchAnalytics.searchTrends.map(trend => trend.searches),
          color: '#FF6600'
        }
      ]
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            {role === 'admin' ? 'Vista general de la plataforma' :
             role === 'cook' ? 'Rendimiento de tus platos' :
             'Estadísticas de entregas'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => loadAnalytics()}
              className={timeRange === '7d' ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
            >
              7 días
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => loadAnalytics()}
              className={timeRange === '30d' ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
            >
              30 días
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => loadAnalytics()}
              className={timeRange === '90d' ? 'bg-moai-orange hover:bg-moai-orange/90' : ''}
            >
              90 días
            </Button>
          </div>
          
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      {showRealTime && realTimeStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              En Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {realTimeStats.activeUsers}
                </div>
                <div className="text-sm text-muted-foreground">Usuarios activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {realTimeStats.currentSearches}
                </div>
                <div className="text-sm text-muted-foreground">Búsquedas (1h)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {realTimeStats.conversionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Conversión (1h)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {realTimeStats?.topQueries?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Consultas únicas</div>
              </div>
            </div>
            
            {(realTimeStats?.topQueries?.length || 0) > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Búsquedas populares (última hora):</h4>
                <div className="flex flex-wrap gap-2">
                  {(realTimeStats?.topQueries || []).slice(0, 5).map((query: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getMetricCards().map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    {metric.change && (
                      <div className={`flex items-center gap-1 text-xs ${
                        metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.changeType === 'increase' ? 
                          <TrendingUp className="h-3 w-3" /> : 
                          <TrendingDown className="h-3 w-3" />
                        }
                        {Math.abs(metric.change)}%
                      </div>
                    )}
                  </div>
                  {metric.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {metric.description}
                    </p>
                  )}
                </div>
                <div className="text-moai-orange">
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Trends Chart */}
        {role === 'admin' && searchAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Tendencias de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Gráfico de tendencias de búsqueda
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(searchAnalytics?.searchTrends || []).length} puntos de datos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Popular Queries */}
        {searchAnalytics && (searchAnalytics.popularQueries?.length || 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Búsquedas Populares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchAnalytics.popularQueries.slice(0, 8).map((query, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{query.query}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-moai-orange h-2 rounded-full"
                          style={{ 
                            width: `${(query.count / searchAnalytics.popularQueries[0].count) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {query.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Performing Items */}
      {topDishes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {role === 'cook' ? 'Tus Platos Populares' : 'Platos Más Populares'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Plato</th>
                    <th className="text-left p-2">Categoría</th>
                    <th className="text-right p-2">Rating</th>
                    <th className="text-right p-2">Reseñas</th>
                    <th className="text-right p-2">Precio</th>
                    {role === 'admin' && <th className="text-right p-2">Cook</th>}
                  </tr>
                </thead>
                <tbody>
                  {topDishes.slice(0, 10).map((dish, index) => (
                    <tr key={dish.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-moai-orange text-white rounded text-xs flex items-center justify-center">
                            {index + 1}
                          </div>
                          <span className="font-medium">{dish.name}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {dish.category}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 text-amber-400 fill-current" />
                          {dish.rating.toFixed(1)}
                        </div>
                      </td>
                      <td className="p-2 text-right">{dish.reviewCount}</td>
                      <td className="p-2 text-right font-medium">
                        ${dish.price.toLocaleString('es-CL')}
                      </td>
                      {role === 'admin' && (
                        <td className="p-2 text-right text-muted-foreground">
                          {dish.cookerName}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Behavior Insights */}
      {searchAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Comportamiento de Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {searchAnalytics.userBehavior.avgSessionDuration.toFixed(0)}s
                </div>
                <div className="text-sm text-muted-foreground">Duración promedio de sesión</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {searchAnalytics.userBehavior.avgSearchesPerSession.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Búsquedas por sesión</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {searchAnalytics.userBehavior.bounceRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Tasa de rebote</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moai-orange mx-auto mb-4"></div>
            <p>Cargando analytics...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;