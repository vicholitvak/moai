'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DriversService, OrdersService, CooksService, DishesService } from '@/lib/firebase/dataService';
import DriverOnboarding from '@/components/DriverOnboarding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Navigation, 
  Package,
  CheckCircle,
  LogOut,
  Truck,
  Timer
} from 'lucide-react';
import type { Driver, Order, Cook, Dish } from '@/lib/firebase/dataService';
import { 
  calculateOrderPreparationTime, 
  calculateProgressPercentage, 
  formatTimeRemaining,
  getEstimatedReadyTime 
} from '@/lib/utils';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import DeliveryFeed from '@/components/DeliveryFeed';
import ActiveDeliveryView from '@/components/ActiveDeliveryView';
import { IdleDriverTrackingService } from '@/lib/services/idleDriverTrackingService';

interface DriverStats {
  totalEarnings: number;
  todayEarnings: number;
  totalDeliveries: number;
  todayDeliveries: number;
  averageRating: number;
  completionRate: number;
  totalDistance: string;
  onlineTime: string;
}

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DriverStats>({
    totalEarnings: 0,
    todayEarnings: 0,
    totalDeliveries: 0,
    todayDeliveries: 0,
    averageRating: 5.0,
    completionRate: 100,
    totalDistance: '0 km',
    onlineTime: '0h 0m'
  });
  const [isOnline, setIsOnline] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('Ubicación no disponible');
  const [cooksMap, setCooksMap] = useState<Map<string, Cook>>(new Map());
  const [dishesMap, setDishesMap] = useState<Map<string, Dish>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<Order | null>(null);
  const [idleTracking, setIdleTracking] = useState<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (user) {
      loadDriverData();
    }
  }, [user]);

  // Cleanup idle tracking when component unmounts
  useEffect(() => {
    return () => {
      if (idleTracking) {
        idleTracking.stop();
      }
    };
  }, [idleTracking]);

  const loadDriverData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Load or create driver profile
      let driver = await DriversService.getDriverById(user.uid);
      
      if (!driver) {
        // No profile exists, show onboarding
        setShowOnboarding(true);
        setLoading(false);
        return;
      }
      
      // Check if profile is complete
      const isComplete = !!(
        driver.displayName &&
        driver.phone &&
        driver.vehicleInfo?.make &&
        driver.vehicleInfo?.model &&
        driver.vehicleInfo?.licensePlate &&
        driver.workingDays?.length > 0
      );
      
      if (!isComplete) {
        // Profile exists but incomplete, show onboarding
        setShowOnboarding(true);
        setLoading(false);
        return;
      }
      
      setDriverData(driver);
      setProfileCompleted(true);
      
      // Continue with existing logic if profile is complete
      if (!driver) {
        // Create driver profile if it doesn't exist (this is now unreachable but kept for safety)
        const newDriver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'> = {
          displayName: user.displayName || 'Conductor',
          email: user.email || '',
          avatar: user.photoURL || '',
          phone: '',
          vehicleType: 'motorcycle',
          vehicleInfo: {
            make: '',
            model: '',
            year: new Date().getFullYear(),
            licensePlate: '',
            color: ''
          },
          isOnline: false,
          isAvailable: false,
          rating: 5.0,
          reviewCount: 0,
          totalDeliveries: 0,
          completionRate: 100,
          earnings: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            total: 0
          },
          workingHours: {
            start: '08:00',
            end: '22:00'
          },
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        };
        
        const success = await DriversService.createDriverProfile(newDriver, user.uid);
        if (!success) {
          console.error('Failed to create driver profile');
          return;
        }
        
        // Reload the created profile
        driver = await DriversService.getDriverById(user.uid);
        if (!driver) {
          console.error('Failed to load created driver profile');
          return;
        }
      }
      
      setDriverData(driver);
      setIsOnline(driver?.isOnline || false);
      
      // Update location if available
      if (driver?.currentLocation?.address?.city) {
        setCurrentLocation(driver.currentLocation.address.city);
      }
      
      // Load orders and stats
      await loadOrdersAndStats();
      
      // Load reference data (cooks and dishes)
      await loadReferenceData();
      
    } catch (error) {
      console.error('Error loading driver data:', error);
      toast.error('Error al cargar datos del conductor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeOrders: () => void;
    let unsubscribeAvailableOrders: () => void;

    if (user) {
      // Subscribe to driver-specific orders
      unsubscribeOrders = DriversService.subscribeToDriverOrders(user.uid, (fetchedOrders) => {
        setOrders(fetchedOrders);
        updateStats(fetchedOrders);
        
        // Check if there's an active delivery order (accepted/preparing/delivering)
        const activeOrder = fetchedOrders.find(order => 
          order.driverId === user.uid && 
          ['accepted', 'preparing', 'delivering'].includes(order.status)
        );
        
        if (activeOrder && (!activeDeliveryOrder || activeOrder.id !== activeDeliveryOrder.id)) {
          setActiveDeliveryOrder(activeOrder);
        } else if (!activeOrder && activeDeliveryOrder) {
          setActiveDeliveryOrder(null);
        }
      });

      // Subscribe to available orders for delivery
      unsubscribeAvailableOrders = OrdersService.subscribeToDriverAvailableOrders((fetchedOrders) => {
        // Filter out orders that are already assigned to the current driver
        const unassignedOrders = fetchedOrders.filter(order => !order.driverId);
        setAvailableOrders(unassignedOrders);

        // Notify driver of new available orders
        if (unassignedOrders.length > availableOrders.length) {
          toast.info(`¡${unassignedOrders.length - availableOrders.length} nuevos pedidos disponibles!`);
        }
      });
    }

    return () => {
      if (unsubscribeOrders) {
        unsubscribeOrders();
      }
      if (unsubscribeAvailableOrders) {
        unsubscribeAvailableOrders();
      }
    };
  }, [user, driverData, availableOrders]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setProfileCompleted(true);
    // Reload the data after onboarding is complete
    if (user?.uid) {
      loadDriverData();
    }
  };

  const updateStats = (currentOrders: Order[]) => {
    const deliveredOrders = currentOrders.filter(order => order.status === 'delivered');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeliveredOrders = deliveredOrders.filter(order => {
      const orderDate = order.actualDeliveryTime?.toDate() || order.createdAt?.toDate() || new Date();
      return orderDate >= today;
    });

    // Drivers typically earn delivery fees, not full order total
    const todayEarnings = todayDeliveredOrders.reduce((sum, order) => sum + (order.deliveryFee || 2500), 0);
    const totalEarnings = deliveredOrders.reduce((sum, order) => sum + (order.deliveryFee || 2500), 0);
    const totalDeliveries = deliveredOrders.length;
    const todayDeliveries = todayDeliveredOrders.length;

    // Update stats with real data
    setStats(prevStats => ({
      ...prevStats,
      todayEarnings,
      totalEarnings,
      todayDeliveries,
      totalDeliveries,
      averageRating: driverData?.rating || 5.0,
      completionRate: driverData?.completionRate || 100,
      totalDistance: `${(totalDeliveries * 2.5).toFixed(1)} km`, // Approximate distance per delivery
      onlineTime: isOnline ? '2h 30m' : '0h 0m' // Simple online time calculation
    }));
  };

  const loadOrdersAndStats = async () => {
    // This function is now primarily for initial load if needed,
    // but real-time updates are handled by the useEffect subscription.
    // We can keep it for consistency or remove if not strictly necessary.
    if (!user) return;
    try {
      // Optionally fetch initial orders if subscription takes time
      // const initialOrders = await DriversService.getOrdersByDriver(user.uid);
      // setOrders(initialOrders);
      // updateStats(initialOrders);
    } catch (error) {
      console.error('Error loading initial orders and stats:', error);
    }
  };

  const loadReferenceData = async () => {
    try {
      // Load all cooks and dishes for reference
      const [cooksData, dishesData] = await Promise.all([
        CooksService.getAllCooks(),
        DishesService.getAllDishes()
      ]);
      
      // Create maps for quick lookup
      const cooksLookup = new Map(cooksData.map(cook => [cook.id, cook]));
      const dishesLookup = new Map(dishesData.map(dish => [dish.id, dish]));
      
      setCooksMap(cooksLookup);
      setDishesMap(dishesLookup);
      
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const handleToggleOnlineStatus = async () => {
    if (!user || !driverData) return;

    setIsTogglingStatus(true);
    
    try {
      const newStatus = !isOnline;
      
      // Update driver status in Firebase
      const success = await DriversService.updateDriverProfile(user.uid, {
        isOnline: newStatus,
        isAvailable: newStatus
      });
      
      if (success) {
        setIsOnline(newStatus);
        setDriverData(prev => prev ? { ...prev, isOnline: newStatus, isAvailable: newStatus } : null);
        
        // Handle idle tracking based on online status
        if (newStatus) {
          // Driver is going online - start idle tracking
          const tracking = IdleDriverTrackingService.startIdleTracking(
            user.uid,
            driverData?.displayName || user.displayName || 'Conductor'
          );
          setIdleTracking(tracking);
          toast.success('¡Estás en línea! Los pedidos comenzarán a aparecer.');
        } else {
          // Driver is going offline - stop idle tracking
          if (idleTracking) {
            idleTracking.stop();
            setIdleTracking(null);
          }
          toast.success('Ahora estás fuera de línea');
        }
      } else {
        toast.error('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
      toast.error('Error al cambiar el estado');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      // If marking as delivered, add actual delivery time
      const updateData: Partial<Order> = { status: newStatus };
      if (newStatus === 'delivered') {
        updateData.actualDeliveryTime = new Date() as any; // Will be converted to Firestore Timestamp
        updateData.isDelivered = true;
      }

      const success = await OrdersService.updateOrder(orderId, updateData);
      if (success) {
        toast.success(`Estado del pedido actualizado a ${getStatusText(newStatus)}`);
        
        // Show completion message for delivered orders
        if (newStatus === 'delivered') {
          toast.success('¡Entrega completada! Las ganancias se han actualizado.', {
            duration: 4000,
          });
          
          // Restart idle tracking after completing a delivery (if driver is still online)
          if (isOnline && user && driverData && !idleTracking) {
            const tracking = IdleDriverTrackingService.startIdleTracking(
              user.uid,
              driverData.displayName || user.displayName || 'Conductor'
            );
            setIdleTracking(tracking);
          }
        }
      } else {
        toast.error(`Error al actualizar el estado del pedido`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error al actualizar el estado del pedido');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;
    try {
      const success = await OrdersService.assignOrderToDriver(orderId, user.uid);
      if (success) {
        // Stop idle tracking when accepting an order (switching to active delivery)
        if (idleTracking) {
          idleTracking.stop();
          setIdleTracking(null);
        }
        toast.success(`Pedido ${orderId} aceptado y asignado.`);
        // The subscription will update the orders state
      } else {
        toast.error(`Error al aceptar el pedido ${orderId}`);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Error al aceptar el pedido');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivering': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo';
      case 'delivering': return 'Entregando';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const getNextAction = (status: Order['status']) => {
    switch (status) {
      case 'ready': return 'Recoger';
      case 'delivering': return 'Entregar';
      default: return null;
    }
  };

  const calculateOrderProgress = (order: Order) => {
    if (!order.createdAt) return { progress: 0, timeRemaining: 'Calculando...', totalPrepTime: 30, isReady: false };

    // Calculate preparation time from the dishes (longest prep time)
    const dishesWithPrepTime = order.dishes.map(dish => ({
      prepTime: dish.prepTime || '30 min',
      quantity: dish.quantity
    }));
    
    const totalPrepTime = calculateOrderPreparationTime(dishesWithPrepTime);
    const startTime = order.createdAt?.toDate() || new Date();
    const progress = calculateProgressPercentage(startTime, totalPrepTime);
    const timeRemaining = formatTimeRemaining(startTime, totalPrepTime);
    const isReady = progress >= 100 || order.status === 'ready';

    return { progress, timeRemaining, totalPrepTime, isReady };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if profile is not complete
  if (showOnboarding) {
    return <DriverOnboarding onComplete={handleOnboardingComplete} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Por favor, inicia sesión para continuar.</p>
        </div>
      </div>
    );
  }

  // Show active delivery view if there's an active order
  if (activeDeliveryOrder) {
    return (
      <ActiveDeliveryView 
        activeOrder={activeDeliveryOrder}
        onBackToDashboard={() => setActiveDeliveryOrder(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard del Conductor</h1>
                <p className="text-sm text-gray-500">{currentLocation}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online Status Toggle */}
              <Button
                onClick={handleToggleOnlineStatus}
                disabled={isTogglingStatus}
                variant={isOnline ? "destructive" : "default"}
                className={`${isOnline ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
              >
                {isTogglingStatus ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                {isOnline ? 'En Línea' : 'Fuera de Línea'}
              </Button>
              
              {/* User Avatar */}
              <Avatar>
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Usuario'} />
                <AvatarFallback>
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Logout Button */}
              <Button
                onClick={logout}
                variant="outline"
                className="hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancias de Hoy</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.todayEarnings.toLocaleString('es-CL')}</div>
              <p className="text-xs text-muted-foreground">
                Total: ${stats.totalEarnings.toLocaleString('es-CL')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregas de Hoy</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                Total: {stats.totalDeliveries}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completionRate}% completado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo en Línea</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onlineTime}</div>
              <p className="text-xs text-muted-foreground">
                Distancia: {stats.totalDistance}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Orders with Live Progress */}
          <div>
            <DeliveryFeed 
              hasActiveDelivery={!!activeDeliveryOrder}
              isDriverOnline={isOnline}
              onOrderAccepted={(orderId) => {
                console.log('Order accepted:', orderId);
              }}
            />
          </div>

          {/* Active Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Mis Pedidos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.filter(order => order.driverId === user?.uid && ['accepted', 'preparing', 'ready', 'delivering'].includes(order.status)).length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tienes pedidos activos asignados.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Acepta un pedido disponible para empezar a entregar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.filter(order => order.driverId === user?.uid && ['accepted', 'preparing', 'ready', 'delivering'].includes(order.status)).map((order) => {
                    const cook = cooksMap.get(order.cookerId);
                    const dish = dishesMap.get(order.dishes[0]?.dishId || '');
                    const nextAction = getNextAction(order.status);
                    const { progress, timeRemaining, totalPrepTime, isReady } = calculateOrderProgress(order);
                    
                    return (
                      <div 
                        key={order.id} 
                        className={`border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-gray-100 transition-colors ${isReady ? 'ring-2 ring-green-200 bg-green-50' : ''}`}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{dish?.name || 'Plato desconocido'}</h4>
                            <p className="text-sm text-gray-600">De: {cook?.displayName || 'Cocinero desconocido'}</p>
                            <p className="text-sm text-gray-600">Para: {order.customerName}</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>

                        {/* Preparation Progress - only show for accepted/preparing status */}
                        {['accepted', 'preparing'].includes(order.status) && (
                          <div className="bg-white p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Timer className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Progreso de preparación</span>
                              </div>
                              <span className="text-sm font-mono font-bold">
                                {isReady ? '🟢 LISTO' : timeRemaining}
                              </span>
                            </div>
                            <Progress 
                              value={progress} 
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Iniciado: {order.createdAt?.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>Estimado: {getEstimatedReadyTime(order.createdAt?.toDate() || new Date(), totalPrepTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        )}

                        {/* Order Items - show when there are multiple dishes */}
                        {order.dishes.length > 1 && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Platos ({order.dishes.length})
                            </h4>
                            <div className="space-y-1">
                              {order.dishes.map((orderDish, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span>{orderDish.dishName} x {orderDish.quantity}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {orderDish.prepTime || '30 min'}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              Tiempo basado en el plato que toma más tiempo
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {order.deliveryInfo.address}
                          </span>
                          <span className="font-medium">${order.total.toLocaleString('es-CL')}</span>
                        </div>
                        
                        {nextAction && (
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent modal from opening when button is clicked
                              handleStatusUpdate(order.id, order.status === 'ready' ? 'delivering' : 'delivered');
                            }}
                            className="w-full"
                            size="sm"
                          >
                            {nextAction}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Pedidos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.filter(order => order.status === 'delivered').length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay entregas recientes</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Tus entregas completadas aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.filter(order => order.status === 'delivered').slice(0, 5).map((order) => {
                    const cook = cooksMap.get(order.cookerId);
                    const dish = dishesMap.get(order.dishes[0]?.dishId || '');
                    
                    return (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{dish?.name || 'Plato desconocido'}</h4>
                            <p className="text-sm text-gray-600">{cook?.displayName || 'Cocinero desconocido'}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Entregado
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {order.actualDeliveryTime?.toDate?.()?.toLocaleDateString('es-CL') || 
                               order.createdAt?.toDate?.()?.toLocaleDateString('es-CL') || 'Fecha no disponible'}
                            </span>
                            <div className="text-right">
                              <span className="text-green-600 font-medium">
                                +${(order.deliveryFee || 2500).toLocaleString('es-CL')}
                              </span>
                              <p className="text-xs text-gray-500">Ganancia por entrega</p>
                            </div>
                          </div>
                          {order.actualDeliveryTime && (
                            <div className="text-xs text-gray-500">
                              Completado: {order.actualDeliveryTime?.toDate()?.toLocaleTimeString('es-CL', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) || 'N/A'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        cooksMap={cooksMap}
        dishesMap={dishesMap}
        onAcceptOrder={handleAcceptOrder}
        onUpdateOrderStatus={handleStatusUpdate}
        isDriverOnline={isOnline}
        isOrderAssignedToDriver={selectedOrder?.driverId === user?.uid}
      />
    </div>
  );
}
