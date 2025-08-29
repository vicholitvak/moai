'use client';
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Timer,
  BarChart3,
  TrendingUp,
  Route,
  Users,
  Activity,
  Calendar,
  Target,
  Award,
  Fuel,
  ShieldCheck,
  User,
  Utensils,
  Map as MapIcon,
  Zap,
  Settings,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  AlertTriangle
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
import DeliveryGuidanceFlow from '@/components/DeliveryGuidanceFlow';
import { IdleDriverTrackingService } from '@/lib/services/idleDriverTrackingService';
import RouteOptimizationService, { OptimizedRoute, RoutePoint } from '@/lib/services/routeOptimizationService';
import { format } from 'date-fns';

interface DriverStats {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalDeliveries: number;
  todayDeliveries: number;
  weekDeliveries: number;
  monthDeliveries: number;
  averageRating: number;
  completionRate: number;
  totalDistance: string;
  onlineTime: string;
  averageDeliveryTime: number;
  customerSatisfactionRate: number;
  onTimeDeliveryRate: number;
  fuelEfficiency: string;
}

interface WeeklyEarnings {
  day: string;
  earnings: number;
  deliveries: number;
}

export default function DriverDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orderFilter, setOrderFilter] = useState('available');
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);
  const [routeOptions, setRouteOptions] = useState({
    prioritizeHighValue: true,
    considerTraffic: true,
    maxDeliveryTime: 120
  });
  const [stats, setStats] = useState<DriverStats>({
    totalEarnings: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalDeliveries: 0,
    todayDeliveries: 0,
    weekDeliveries: 0,
    monthDeliveries: 0,
    averageRating: 5.0,
    completionRate: 100,
    totalDistance: '0 km',
    onlineTime: '0h 0m',
    averageDeliveryTime: 25,
    customerSatisfactionRate: 98,
    onTimeDeliveryRate: 95,
    fuelEfficiency: '12.5 km/L'
  });
  const [isOnline, setIsOnline] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('Ubicación no disponible');
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cooksMap, setCooksMap] = useState<Map<string, Cook>>(new Map());
  const [dishesMap, setDishesMap] = useState<Map<string, Dish>>(new Map<string, Dish>());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<Order | null>(null);
  const [showGuidanceFlow, setShowGuidanceFlow] = useState(false);
  const [idleTracking, setIdleTracking] = useState<{ stop: () => void } | null>(null);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);

  // Get real driver location on mount and when user changes
  useEffect(() => {
    if (!user) return;
    const geoSuccess = (position: GeolocationPosition) => {
      setDriverCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
    };
    const geoError = (err: GeolocationPositionError) => {
      setCurrentLocation('Ubicación no disponible');
      setDriverCoords(null);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError, { enableHighAccuracy: true, timeout: 10000 });
    }
    loadDriverData();
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
        console.log('DriverDashboard: No driver profile found, showing onboarding');
        setShowOnboarding(true);
        setLoading(false);
        return;
      }
      
      // Check if profile is complete
      const isComplete = !!(
        driver.displayName &&
        driver.phone &&
        driver.vehicleType &&
        driver.workingDays?.length > 0
      );
      
      if (!isComplete) {
        // Profile exists but incomplete, show onboarding
        console.log('DriverDashboard: Driver profile incomplete, showing onboarding. Missing:', {
          displayName: !driver.displayName,
          phone: !driver.phone,
          vehicleType: !driver.vehicleType,
          workingDays: !driver.workingDays?.length
        });
        setShowOnboarding(true);
        setLoading(false);
        return;
      }
      
      console.log('DriverDashboard: Driver profile is complete, proceeding with dashboard');
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
        
        // Check if there's an active delivery order (accepted/preparing/ready/delivering)
        const activeOrder = fetchedOrders.find(order => 
          order.driverId === user.uid && 
          ['accepted', 'preparing', 'ready', 'delivering'].includes(order.status)
        );
        
        if (activeOrder && (!activeDeliveryOrder || activeOrder.id !== activeDeliveryOrder.id)) {
          setActiveDeliveryOrder(activeOrder);
          // Auto-show guidance flow for newly accepted orders
          if (activeOrder.status === 'accepted' && (!activeDeliveryOrder || activeOrder.id !== activeDeliveryOrder.id)) {
            setShowGuidanceFlow(true);
          }
        } else if (!activeOrder && activeDeliveryOrder) {
          setActiveDeliveryOrder(null);
          setShowGuidanceFlow(false);
        }

        // Detect status changes and show notifications
        if (activeDeliveryOrder && activeOrder && activeOrder.id === activeDeliveryOrder.id && activeOrder.status !== activeDeliveryOrder.status) {
          const statusMessages = {
            'accepted': {
              title: 'Pedido Aceptado',
              description: 'El cocinero confirmará la disponibilidad pronto',
              duration: 3000
            },
            'preparing': {
              title: '🍳 ¡Preparación iniciada!',
              description: 'El cocinero está preparando tu pedido',
              duration: 4000
            },
            'ready': {
              title: '📦 ¡Pedido listo para recoger!',
              description: 'Ve al restaurante para recoger el pedido',
              duration: 5000
            },
            'delivering': {
              title: '🚗 En camino al cliente',
              description: 'Dirígete a la dirección de entrega',
              duration: 3000
            },
            'delivered': {
              title: '✅ ¡Entrega completada!',
              description: 'Ganancia agregada a tu cuenta',
              duration: 4000
            }
          };

          const statusInfo = statusMessages[activeOrder.status as keyof typeof statusMessages];
          if (statusInfo) {
            toast.success(statusInfo.title, {
              description: statusInfo.description,
              duration: statusInfo.duration
            });

            // Auto-show guidance flow when status changes to important states
            if (['preparing', 'ready', 'delivering'].includes(activeOrder.status)) {
              setShowGuidanceFlow(true);
            }
          }
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
    const now = new Date();
    
    // Date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date();
    monthStart.setMonth(now.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    // Filter orders by time periods
    const todayDeliveredOrders = deliveredOrders.filter(order => {
      const orderDate = order.actualDeliveryTime?.toDate() || order.createdAt?.toDate() || new Date();
      return orderDate >= today;
    });
    
    const weekDeliveredOrders = deliveredOrders.filter(order => {
      const orderDate = order.actualDeliveryTime?.toDate() || order.createdAt?.toDate() || new Date();
      return orderDate >= weekStart;
    });
    
    const monthDeliveredOrders = deliveredOrders.filter(order => {
      const orderDate = order.actualDeliveryTime?.toDate() || order.createdAt?.toDate() || new Date();
      return orderDate >= monthStart;
    });

    // Calculate earnings (drivers typically earn delivery fees + tips)
    const todayEarnings = todayDeliveredOrders.reduce((sum, order) => sum + (order.deliveryFee || 2500), 0);
    const weekEarnings = weekDeliveredOrders.reduce((sum, order) => sum + (order.deliveryFee || 2500), 0);
    const monthEarnings = monthDeliveredOrders.reduce((sum, order) => sum + (order.deliveryFee || 2500), 0);
    const totalEarnings = deliveredOrders.reduce((sum, order) => sum + (order.deliveryFee || 2500), 0);
    
    // Calculate delivery counts
    const todayDeliveries = todayDeliveredOrders.length;
    const weekDeliveries = weekDeliveredOrders.length;
    const monthDeliveries = monthDeliveredOrders.length;
    const totalDeliveries = deliveredOrders.length;

    // Calculate performance metrics
    const averageDeliveryTime = deliveredOrders.length > 0 
      ? deliveredOrders.reduce((sum, order) => {
          const created = order.createdAt?.toDate() || new Date();
          const delivered = order.actualDeliveryTime?.toDate() || new Date();
          return sum + (delivered.getTime() - created.getTime()) / (1000 * 60); // minutes
        }, 0) / deliveredOrders.length 
      : 25;

    const onTimeDeliveries = deliveredOrders.filter(order => {
      const created = order.createdAt?.toDate() || new Date();
      const delivered = order.actualDeliveryTime?.toDate() || new Date();
      const deliveryTime = (delivered.getTime() - created.getTime()) / (1000 * 60);
      const estimatedTime = typeof order.estimatedDeliveryTime === 'number' ? order.estimatedDeliveryTime : 45;
      return deliveryTime <= estimatedTime; // on time if within estimated time
    }).length;

    const onTimeDeliveryRate = deliveredOrders.length > 0 ? (onTimeDeliveries / deliveredOrders.length) * 100 : 95;

    // Update stats with enhanced metrics
    setStats(prevStats => ({
      ...prevStats,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalEarnings,
      todayDeliveries,
      weekDeliveries,
      monthDeliveries,
      totalDeliveries,
      averageRating: driverData?.rating || 5.0,
      completionRate: driverData?.completionRate || 100,
      totalDistance: `${(totalDeliveries * 2.5).toFixed(1)} km`,
      onlineTime: isOnline ? '2h 30m' : '0h 0m',
      averageDeliveryTime: Math.round(averageDeliveryTime),
      customerSatisfactionRate: 98, // This could be calculated from reviews
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate),
      fuelEfficiency: '12.5 km/L' // This would come from vehicle data
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
        
        // Show guidance flow for the accepted order
        setShowGuidanceFlow(true);
        setActiveTab('dashboard'); // Keep on dashboard to show guidance
        
        toast.success('¡Pedido aceptado!', {
          description: 'Sigue la guía paso a paso para completar la entrega.',
          duration: 4000
        });
      } else {
        toast.error(`Error al aceptar el pedido ${orderId}`);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Error al aceptar el pedido');
    }
  };

  const handleStartDeliveryTracking = async (orderId: string) => {
    if (!user) return;
    
    try {
      // Get current location using geolocation API
      if (!navigator.geolocation) {
        toast.error('Geolocalización no disponible');
        return;
      }

      toast.info('Obteniendo ubicación...');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          const success = await OrdersService.startDeliveryTracking(orderId, {
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          });

          if (success) {
            toast.success('¡Viaje iniciado! El cliente puede seguir tu ubicación.');
            
            // Start continuous location tracking
            startLocationTracking(orderId);
          } else {
            toast.error('Error al iniciar el seguimiento');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('No se pudo obtener la ubicación. Verifica los permisos.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } catch (error) {
      console.error('Error starting delivery tracking:', error);
      toast.error('Error al iniciar el viaje');
    }
  };

  const startLocationTracking = (orderId: string) => {
    if (locationWatchId) {
      navigator.geolocation.clearWatch(locationWatchId);
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Update location in Firebase
          await OrdersService.updateDriverLocation(orderId, {
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          });
        } catch (error) {
          console.error('Error updating driver location:', error);
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );

    setLocationWatchId(watchId);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivering': return 'bg-indigo-100 text-indigo-800';
      case 'en_viaje': return 'bg-blue-100 text-blue-800';
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
      case 'en_viaje': return 'En Viaje';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const getNextAction = (status: Order['status']) => {
    switch (status) {
      case 'ready': return 'Recoger';
      case 'delivering': return 'Iniciar Viaje';
      case 'en_viaje': return 'Entregar';
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

  // Route optimization functions
  const optimizeDeliveryRoute = async () => {
    if (!user || availableOrders.length === 0) {
      toast.error('No hay órdenes disponibles para optimizar');
      return;
    }
    if (!driverCoords) {
      toast.error('Ubicación del conductor no disponible');
      return;
    }
    setIsOptimizingRoute(true);
    try {
      const route = await RouteOptimizationService.optimizeRoute(
        availableOrders,
        driverCoords,
        routeOptions
      );
      setOptimizedRoute(route);
      toast.success(`Ruta optimizada para ${route.points.length} entregas`);
    } catch (error) {
      console.error('Error optimizing route:', error);
      toast.error('Error al optimizar la ruta');
    } finally {
      setIsOptimizingRoute(false);
    }
  };

  const startNavigationWithRoute = () => {
    if (!optimizedRoute || optimizedRoute.points.length === 0) {
      toast.error('Primero optimiza la ruta');
      return;
    }

    const navigationUrl = RouteOptimizationService.generateNavigationUrl(
      optimizedRoute.points,
      true
    );
    
    if (navigationUrl) {
      window.open(navigationUrl, '_blank');
      toast.success('Navegación iniciada en Google Maps');
    } else {
      toast.error('Error al generar la URL de navegación');
    }
  };

  const handleNavigateToAddress = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
    toast.success('Navegación iniciada en Google Maps');
  };

  const handleCallCustomer = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.error('Número de teléfono no disponible');
    }
  };

  const acceptOptimizedOrders = async () => {
    if (!optimizedRoute || !user) {
      toast.error('No hay ruta optimizada disponible');
      return;
    }

    try {
      const acceptPromises = optimizedRoute.points.map(point => 
        OrdersService.assignOrderToDriver(point.orderId, user.uid)
      );
      
      const results = await Promise.all(acceptPromises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        toast.success(`${successCount} órdenes aceptadas y asignadas`);
        setOptimizedRoute(null); // Clear route after accepting
      } else {
        toast.error('Error al aceptar las órdenes');
      }
    } catch (error) {
      console.error('Error accepting optimized orders:', error);
      toast.error('Error al aceptar las órdenes optimizadas');
    }
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
                className={`font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none ${isOnline ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
                aria-pressed={isOnline}
                aria-label={isOnline ? 'Cambiar a fuera de línea' : 'Cambiar a en línea'}
              >
                {isTogglingStatus ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                {isOnline ? 'En Línea' : 'Fuera de Línea'}
              </Button>
              
              {/* Theme Toggle */}

              
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'orders', label: 'Órdenes', icon: Package },
              { id: 'earnings', label: 'Ganancias', icon: DollarSign },
              { id: 'performance', label: 'Rendimiento', icon: Target },
              { id: 'navigation', label: 'Navegación', icon: Route }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Show Delivery Guidance Flow if there's an active order and guidance is enabled */}
            {activeDeliveryOrder && showGuidanceFlow && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Guía de Entrega</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGuidanceFlow(false)}
                  >
                    Minimizar Guía
                  </Button>
                </div>
                <DeliveryGuidanceFlow
                  order={activeDeliveryOrder}
                  cook={activeDeliveryOrder ? cooksMap.get((activeDeliveryOrder as Order).cookerId) : undefined}
                  onStatusUpdate={handleStatusUpdate}
                  onStartNavigation={handleNavigateToAddress}
                  onCallCustomer={handleCallCustomer}
                />
              </div>
            )}

            {/* Show option to expand guidance if there's an active order but guidance is hidden */}
            {activeDeliveryOrder && !showGuidanceFlow && (
              <Card className="mb-6 bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          Tienes una entrega activa - Pedido #{activeDeliveryOrder ? (activeDeliveryOrder as Order).id.slice(-8) : ''}
                        </h3>
                        <p className="text-sm text-blue-700">
                          Estado: {activeDeliveryOrder ? getStatusText((activeDeliveryOrder as Order).status) : ''} • Cliente: {activeDeliveryOrder ? (activeDeliveryOrder as Order).customerName : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowGuidanceFlow(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Ver Guía
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Stats Grid */}
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
                handleAcceptOrder(orderId);
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
                              
                              if (order.status === 'ready') {
                                // Change to delivering (picked up)
                                handleStatusUpdate(order.id, 'delivering');
                              } else if (order.status === 'delivering') {
                                // Start tracking journey to customer
                                handleStartDeliveryTracking(order.id);
                              } else if (order.status === 'en_viaje') {
                                // Mark as delivered (requires verification code)
                                router.push('/driver/delivery-verification');
                              }
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
          </>
        )}

        {/* Enhanced Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Ganancias de Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${stats.todayEarnings.toLocaleString('es-CL')}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.todayDeliveries} entregas realizadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Esta Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    ${stats.weekEarnings.toLocaleString('es-CL')}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.weekDeliveries} entregas esta semana
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                    Este Mes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    ${stats.monthEarnings.toLocaleString('es-CL')}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.monthDeliveries} entregas este mes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Desglose de Ganancias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Tarifas base de entrega</span>
                      <span className="font-semibold">${(stats.todayEarnings * 0.8).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Propinas</span>
                      <span className="font-semibold">${(stats.todayEarnings * 0.15).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Bonificaciones</span>
                      <span className="font-semibold">${(stats.todayEarnings * 0.05).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total del día</span>
                        <span className="text-green-600">${stats.todayEarnings.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Ganancias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ganancia promedio por entrega</span>
                      <span className="font-semibold">
                        ${stats.totalDeliveries > 0 ? (stats.totalEarnings / stats.totalDeliveries).toLocaleString('es-CL') : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Entregas por hora (promedio)</span>
                      <span className="font-semibold">2.3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ganancia por hora</span>
                      <span className="font-semibold">$5,750</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Mejor día del mes</span>
                      <span className="font-semibold text-green-600">$18,500</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Performance Metrics Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Tiempo Promedio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageDeliveryTime} min</div>
                  <p className="text-sm text-muted-foreground">Por entrega</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-green-600" />
                    Entregas a Tiempo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.onTimeDeliveryRate}%</div>
                  <p className="text-sm text-muted-foreground">Puntualidad</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-600" />
                    Satisfacción Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.customerSatisfactionRate}%</div>
                  <p className="text-sm text-muted-foreground">Calificación promedio</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Fuel className="h-5 w-5 mr-2 text-orange-600" />
                    Eficiencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.fuelEfficiency}</div>
                  <p className="text-sm text-muted-foreground">Consumo combustible</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Logros y Metas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
                        <span className="text-sm font-medium">Conductor Confiable</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Conseguido</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 mr-2 text-yellow-600" />
                        <span className="text-sm font-medium">5 Estrellas</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Conseguido</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        <span className="text-sm font-medium">100 Entregas</span>
                      </div>
                      <Badge variant="outline">En Progreso</Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progreso hacia 100 entregas</span>
                        <span>{stats.totalDeliveries}/100</span>
                      </div>
                      <Progress value={(stats.totalDeliveries / 100) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Métricas de Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Puntualidad</span>
                        <span>{stats.onTimeDeliveryRate}%</span>
                      </div>
                      <Progress value={stats.onTimeDeliveryRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tasa de Aceptación</span>
                        <span>{stats.completionRate}%</span>
                      </div>
                      <Progress value={stats.completionRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Satisfacción del Cliente</span>
                        <span>{stats.customerSatisfactionRate}%</span>
                      </div>
                      <Progress value={stats.customerSatisfactionRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Calificación General</span>
                        <span>{stats.averageRating.toFixed(1)}/5.0</span>
                      </div>
                      <Progress value={(stats.averageRating / 5) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation Tab - Route Optimization */}
        {activeTab === 'navigation' && (
          <div className="space-y-6">
            {/* Route Optimization Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Available Orders for Route */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Route className="h-5 w-5 mr-2" />
                      Órdenes Disponibles ({availableOrders.length})
                    </div>
                    <Button
                      onClick={optimizeDeliveryRoute}
                      disabled={isOptimizingRoute || availableOrders.length === 0}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isOptimizingRoute ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Optimizando...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Optimizar Ruta
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes disponibles</h3>
                      <p className="text-gray-500">
                        Las órdenes listas para entrega aparecerán aquí para ser optimizadas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {availableOrders.map((order) => {
                        const cook = cooksMap.get(order.cookerId);
                        return (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-orange-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm truncate">
                                  #{order.id.slice(-8)}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {cook ? cook.displayName : 'Cocinero'} • {order.customerName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">${order.total.toLocaleString('es-CL')}</p>
                              <p className="text-xs text-gray-500">
                                {order.deliveryInfo.address.slice(0, 30)}...
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Route Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configuración
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Priorizar Pedidos Costosos</label>
                      <input
                        type="checkbox"
                        checked={routeOptions.prioritizeHighValue}
                        onChange={(e) => setRouteOptions({
                          ...routeOptions,
                          prioritizeHighValue: e.target.checked
                        })}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Considerar Tráfico</label>
                      <input
                        type="checkbox"
                        checked={routeOptions.considerTraffic}
                        onChange={(e) => setRouteOptions({
                          ...routeOptions,
                          considerTraffic: e.target.checked
                        })}
                        className="rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Tiempo Máximo (min): {routeOptions.maxDeliveryTime}
                      </label>
                      <input
                        type="range"
                        min="60"
                        max="180"
                        value={routeOptions.maxDeliveryTime}
                        onChange={(e) => setRouteOptions({
                          ...routeOptions,
                          maxDeliveryTime: parseInt(e.target.value)
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optimized Route Display */}
            {optimizedRoute && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapIcon className="h-5 w-5 mr-2" />
                      Ruta Optimizada
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={startNavigationWithRoute}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Navegar
                      </Button>
                      <Button
                        onClick={acceptOptimizedOrders}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aceptar Todas
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Route Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Route className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Total Entregas</p>
                      <p className="text-lg font-bold text-blue-600">{optimizedRoute.points.length}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Navigation className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Distancia</p>
                      <p className="text-lg font-bold text-green-600">{optimizedRoute.totalDistance} km</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Tiempo Total</p>
                      <p className="text-lg font-bold text-orange-600">{Math.round(optimizedRoute.totalTime)} min</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Fuel className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Costo Combustible</p>
                      <p className="text-lg font-bold text-purple-600">${optimizedRoute.estimatedFuelCost}</p>
                    </div>
                  </div>

                  {/* Efficiency Score */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Eficiencia de la Ruta</span>
                      <span className="text-sm font-bold">{optimizedRoute.efficiency}%</span>
                    </div>
                    <Progress value={optimizedRoute.efficiency} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {optimizedRoute.efficiency >= 80 ? '¡Excelente optimización!' :
                       optimizedRoute.efficiency >= 60 ? 'Buena optimización' :
                       'Ruta poco eficiente'}
                    </p>
                  </div>

                  {/* Route Steps */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Secuencia de Entregas:</h4>
                    {optimizedRoute.points.map((point, index) => {
                      const order = availableOrders.find(o => o.id === point.orderId);
                      const cook = order ? cooksMap.get(order.cookerId) : null;
                      
                      return (
                        <div key={point.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-sm truncate">
                                  Pedido #{point.orderId.slice(-8)}
                                </h5>
                                <p className="text-xs text-gray-500">
                                  {cook ? cook.displayName : 'Cocinero'} → {point.customerName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">${point.orderValue.toLocaleString('es-CL')}</p>
                                <Badge 
                                  className={`text-xs ${
                                    point.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    point.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {point.priority === 'high' ? 'Alta' :
                                   point.priority === 'medium' ? 'Media' : 'Baja'} Prioridad
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center mt-2">
                              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                              <p className="text-xs text-gray-600 truncate">{point.address}</p>
                            </div>
                            <div className="flex items-center mt-1">
                              <Clock className="h-3 w-3 text-gray-400 mr-1" />
                              <p className="text-xs text-gray-500">
                                ~{Math.round(point.estimatedDeliveryTime)} min de entrega
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const address = encodeURIComponent(point.address);
                                window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                              }}
                            >
                              <Navigation className="h-3 w-3" />
                            </Button>
                          </div>
                          {index < optimizedRoute.points.length - 1 && (
                            <div className="absolute left-4 mt-12 w-0.5 h-6 bg-gray-300"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Warning for long routes */}
                  {optimizedRoute.totalTime > 120 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                        <p className="text-sm text-yellow-800">
                          Esta ruta tomará más de 2 horas. Considera dividir las entregas en múltiples viajes.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {!optimizedRoute && availableOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Cómo usar la optimización de rutas?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        1
                      </div>
                      <span>Configura las preferencias de optimización (prioridad, tráfico, tiempo máximo)</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        2
                      </div>
                      <span>Presiona "Optimizar Ruta" para calcular la mejor secuencia de entregas</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        3
                      </div>
                      <span>Revisa la ruta propuesta, métricas de eficiencia y secuencia de entregas</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        4
                      </div>
                      <span>Acepta todas las órdenes de la ruta optimizada o navega individualmente</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Beneficios de la optimización:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Reduce distancia total y tiempo de entrega</li>
                      <li>• Prioriza pedidos de alto valor y urgencia</li>
                      <li>• Minimiza costos de combustible</li>
                      <li>• Mejora eficiencia y satisfacción del cliente</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Orders Tab - Enhanced */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Order Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{availableOrders.length}</div>
                  <p className="text-sm text-muted-foreground">Órdenes disponibles</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-600" />
                    En Progreso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.filter(o => ['accepted', 'preparing', 'ready', 'delivering'].includes(o.status)).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Órdenes activas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Completadas Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayDeliveries}</div>
                  <p className="text-sm text-muted-foreground">Entregas de hoy</p>
                </CardContent>
              </Card>
            </div>

            {/* Order Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              {[
                { id: 'available', label: 'Disponibles', count: availableOrders.length },
                { id: 'active', label: 'Activas', count: orders.filter(o => ['accepted', 'preparing', 'ready', 'delivering'].includes(o.status) && o.driverId === user?.uid).length },
                { id: 'completed', label: 'Completadas', count: orders.filter(o => o.status === 'delivered' && o.driverId === user?.uid).length }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setOrderFilter(filter.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    orderFilter === filter.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div className="grid gap-4">
              {(() => {
                let filteredOrders: Order[] = [];
                if (orderFilter === 'available') {
                  filteredOrders = availableOrders;
                } else if (orderFilter === 'active') {
                  filteredOrders = orders.filter(o => 
                    ['accepted', 'preparing', 'ready', 'delivering'].includes(o.status) && 
                    o.driverId === user?.uid
                  );
                } else if (orderFilter === 'completed') {
                  filteredOrders = orders.filter(o => 
                    o.status === 'delivered' && 
                    o.driverId === user?.uid
                  ).slice(0, 10); // Show last 10 completed orders
                }

                if (filteredOrders.length === 0) {
                  return (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {orderFilter === 'available' && 'No hay órdenes disponibles'}
                          {orderFilter === 'active' && 'No tienes órdenes activas'}
                          {orderFilter === 'completed' && 'No has completado entregas hoy'}
                        </h3>
                        <p className="text-gray-500 text-center max-w-sm">
                          {orderFilter === 'available' && 'Las nuevas órdenes aparecerán aquí cuando estén listas para entrega.'}
                          {orderFilter === 'active' && 'Las órdenes que aceptes aparecerán aquí.'}
                          {orderFilter === 'completed' && 'Tus entregas completadas aparecerán aquí.'}
                        </p>
                      </CardContent>
                    </Card>
                  );
                }

                return filteredOrders.map((order: Order) => {
                  const cook = cooksMap.get(order.cookerId);
                  const totalItems = order.dishes.reduce((sum: number, dish: { quantity: number }) => sum + dish.quantity, 0);
                  
                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Order Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    Pedido #{order.id.slice(-8)}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {cook ? cook.displayName : 'Cocinero desconocido'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  ${order.total.toLocaleString('es-CL')}
                                </div>
                                <Badge className={getStatusColor(order.status)}>
                                  {getStatusText(order.status)}
                                </Badge>
                              </div>
                            </div>

                            {/* Order Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{order.customerName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Utensils className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{totalItems} platos</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {format(order.createdAt.toDate(), 'HH:mm')}
                                </span>
                              </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-gray-600">
                                  {order.deliveryInfo.address}
                                </p>
                                {order.deliveryInfo.instructions && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Instrucciones: {order.deliveryInfo.instructions}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsModalOpen(true);
                                }}
                              >
                                Ver Detalles
                              </Button>
                              
                              {orderFilter === 'available' && isOnline && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptOrder(order.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Aceptar Entrega
                                </Button>
                              )}
                              
                              {orderFilter === 'active' && order.status === 'accepted' && (
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                    Esperando confirmación del cocinero
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    El cocinero debe confirmar que puede preparar el pedido
                                  </p>
                                </div>
                              )}
                              
                              {orderFilter === 'active' && order.status === 'preparing' && (
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                                    Preparando
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    El cocinero está preparando el pedido
                                  </p>
                                </div>
                              )}
                              
                              {orderFilter === 'active' && order.status === 'ready' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(order.id, 'delivering')}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Recoger y Entregar
                                </Button>
                              )}
                              
                              {orderFilter === 'active' && order.status === 'delivering' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Confirmar Entrega
                                </Button>
                              )}
                              
                              {order.deliveryInfo.address && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const address = encodeURIComponent(order.deliveryInfo.address);
                                    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                                  }}
                                >
                                  <Navigation className="h-4 w-4 mr-1" />
                                  Navegar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </div>
          </div>
        )}
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
