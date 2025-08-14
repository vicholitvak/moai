'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { OrdersService, DishesService, CooksService } from '@/lib/firebase/dataService';
import { NotificationService } from '@/lib/services/notificationService';
import { 
  Bell, 
  ShoppingBag, 
  Clock, 
  TrendingUp, 
  Heart,
  MapPin,
  ChefHat,
  Package,
  CreditCard,
  Star,
  ArrowRight,
  Utensils,
  Truck,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

// Order status mapping for display
const orderStatusMap = {
  pending: { label: 'Pendiente', color: 'yellow', icon: Clock },
  accepted: { label: 'Aceptado', color: 'blue', icon: CheckCircle },
  preparing: { label: 'Preparando', color: 'orange', icon: ChefHat },
  ready: { label: 'Listo', color: 'green', icon: Package },
  delivering: { label: 'En camino', color: 'purple', icon: Truck },
  delivered: { label: 'Entregado', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'red', icon: AlertCircle }
};

const ClientHome = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [favoriteDishes, setFavoriteDishes] = useState<any[]>([]);
  const [featuredDishes, setFeaturedDishes] = useState<any[]>([]);
  const [topCooks, setTopCooks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    favoriteCuisine: '',
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    fetchDashboardData();
    setupRealtimeListeners();
    
    // Load notifications
    NotificationService.loadPersistedNotifications();
    const unsubscribe = NotificationService.subscribe((notifications) => {
      setUnreadNotifications(NotificationService.getUnreadCount());
    });

    return () => {
      unsubscribe();
    };
  }, [user, router]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch active orders
      const orders = await OrdersService.getOrdersByCustomer(user.uid);
      const active = orders.filter(o => 
        ['pending', 'accepted', 'preparing', 'ready', 'delivering'].includes(o.status)
      );
      const recent = orders.filter(o => o.status === 'delivered').slice(0, 5);
      
      setActiveOrders(active);
      setRecentOrders(recent);
      
      // Calculate stats
      const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      setStats({
        totalOrders: orders.length,
        totalSpent,
        favoriteCuisine: 'Italiana', // This would be calculated from order history
        averageRating: 4.5 // This would be calculated from reviews
      });
      
      // Fetch all dishes
      const allDishes = await DishesService.getAllDishes();
      
      // Featured dishes - real dishes from the platform, sorted by rating and availability
      const featured = allDishes
        .filter(d => d.isAvailable)
        .sort((a, b) => {
          // Prioritize dishes with actual ratings, then by creation date
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          if (ratingA !== ratingB) {
            return ratingB - ratingA;
          }
          // If ratings are equal, prioritize newer dishes
          const dateA = a.createdAt?.toDate() || new Date(0);
          const dateB = b.createdAt?.toDate() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 6);
      setFeaturedDishes(featured);
      
      // Recommendations - different dishes from featured
      const recommendedDishes = allDishes
        .filter(d => d.isAvailable && !featured.includes(d))
        .slice(0, 6);
      setRecommendations(recommendedDishes);
      
      // Fetch favorite dishes - could be based on user preferences in the future
      const otherDishes = allDishes
        .filter(d => d.isAvailable && !featured.includes(d) && !recommendedDishes.includes(d))
        .slice(0, 4);
      setFavoriteDishes(otherDishes);
      
      // Fetch top cooks
      const cooks = await CooksService.getAllCooks();
      setTopCooks(cooks.slice(0, 4));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    if (!user) return;
    
    // Listen for order updates
    const unsubscribe = OrdersService.subscribeToCustomerOrders(
      user.uid,
      (orders) => {
        const active = orders.filter(o => 
          ['pending', 'accepted', 'preparing', 'ready', 'delivering'].includes(o.status)
        );
        setActiveOrders(active);
        
        // Show notifications for status changes
        active.forEach(order => {
          if (order.status === 'accepted') {
            NotificationService.notifyOrderStatusChange(order.id, order.status, 'customer');
          }
        });
      }
    );
    
    return () => unsubscribe();
  };

  const getOrderProgress = (status: string): number => {
    const progressMap: { [key: string]: number } = {
      pending: 20,
      accepted: 40,
      preparing: 60,
      ready: 80,
      delivering: 90,
      delivered: 100
    };
    return progressMap[status] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">¡Hola, {user?.displayName || 'Cliente'}!</h1>
                <p className="text-sm text-muted-foreground">Bienvenido a tu dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/notifications')}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/cart')}
                className="relative"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dishes')}
              >
                <Search className="h-4 w-4 mr-2" />
                Explorar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pedidos</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gastado</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.totalSpent)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cocina Favorita</p>
                  <p className="text-2xl font-bold">{stats.favoriteCuisine}</p>
                </div>
                <Utensils className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rating Promedio</p>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold">{stats.averageRating}</p>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Dishes */}
        {featuredDishes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                Platos Destacados
              </CardTitle>
              <CardDescription>Los mejores platos según nuestros clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {featuredDishes.map((dish) => (
                  <Card 
                    key={dish.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                    onClick={() => router.push(`/dishes/${dish.id}`)}
                  >
                    <div className="aspect-square relative">
                      <img 
                        src={dish.image} 
                        alt={dish.name}
                        className="w-full h-full object-cover rounded-t-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop';
                        }}
                      />
                      <Badge className="absolute top-2 left-2 bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                      {dish.rating > 4.5 && (
                        <Badge className="absolute top-2 right-2 bg-green-500">
                          Mejor Valorado
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">{dish.name}</h3>
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                        Por {dish.cookerName}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                        {dish.category}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{formatPrice(dish.price)}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{dish.rating?.toFixed(1) || 'Nuevo'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pedidos Activos
              </CardTitle>
              <CardDescription>Seguimiento en tiempo real de tus pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOrders.map((order) => {
                  const StatusIcon = orderStatusMap[order.status as keyof typeof orderStatusMap]?.icon || Clock;
                  const statusInfo = orderStatusMap[order.status as keyof typeof orderStatusMap];
                  
                  return (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-5 w-5 text-${statusInfo?.color}-500`} />
                          <div>
                            <p className="font-semibold">Pedido #{order.id.slice(-6)}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.dishes?.length || 0} items • {formatPrice(order.total)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={statusInfo?.color === 'green' ? 'default' : 'secondary'}>
                          {statusInfo?.label}
                        </Badge>
                      </div>
                      
                      <Progress value={getOrderProgress(order.status)} className="mb-2" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tiempo estimado: 30-45 min
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          Ver detalles
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="recommendations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations">Recomendados</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos</TabsTrigger>
            <TabsTrigger value="cooks">Cocineros Top</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recomendados para ti</CardTitle>
                <CardDescription>Basado en tus pedidos anteriores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((dish) => (
                    <Card 
                      key={dish.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/dishes/${dish.id}`)}
                    >
                      <div className="aspect-video relative">
                        <img 
                          src={dish.image} 
                          alt={dish.name}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                        {dish.isAvailable && (
                          <Badge className="absolute top-2 right-2">Disponible</Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1">{dish.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {dish.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">{formatPrice(dish.price)}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{dish.rating}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tus Favoritos</CardTitle>
                <CardDescription>Platos que has marcado como favoritos</CardDescription>
              </CardHeader>
              <CardContent>
                {favoriteDishes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favoriteDishes.map((dish) => (
                      <div 
                        key={dish.id}
                        className="flex gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => router.push(`/dishes/${dish.id}`)}
                      >
                        <img 
                          src={dish.image} 
                          alt={dish.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{dish.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{dish.category}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{formatPrice(dish.price)}</span>
                            <Button size="sm" variant="ghost">
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No tienes platos favoritos aún</p>
                    <Button onClick={() => router.push('/dishes')}>
                      Explorar Platos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cocineros Destacados</CardTitle>
                <CardDescription>Los mejores cocineros de tu zona</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topCooks.map((cook) => (
                    <Card 
                      key={cook.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/cooks/${cook.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={cook.avatar} />
                            <AvatarFallback>
                              <ChefHat className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{cook.displayName}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {cook.specialties?.join(', ')}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{cook.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{cook.distance || 'Cerca'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                <span>{cook.totalOrders} pedidos</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pedidos Recientes</CardTitle>
              <CardDescription>Tu historial de pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Pedido #{order.id.slice(-6)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt?.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      <Button variant="ghost" size="sm">
                        Repetir pedido
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => router.push('/orders')}
              >
                Ver todos los pedidos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => router.push('/dishes')}
          >
            <Utensils className="h-6 w-6" />
            <span>Explorar Platos</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => router.push('/cart')}
          >
            <ShoppingBag className="h-6 w-6" />
            <span>Mi Carrito</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => router.push('/favorites')}
          >
            <Heart className="h-6 w-6" />
            <span>Favoritos</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => router.push('/profile')}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span>Mi Perfil</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientHome;