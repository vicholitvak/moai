'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DriversService, OrdersService, CooksService, DishesService, type Order, type Cook, type Dish } from '@/lib/firebase/dataService';
import { toast } from 'sonner';
import { 
  MapPin,
  Clock,
  DollarSign,
  Package,
  Navigation,
  CheckCircle,
  AlertCircle,
  Car,
  Phone,
  MessageCircle,
  Star,
  TrendingUp,
  Route,
  LogOut,
  Bell,
  Settings,
  Play,
  Pause,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Loader2,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DriverLocationTracker from '@/components/DriverLocationTracker';

// Use Order interface from Firebase instead of custom Delivery interface

interface DriverStats {
  todayEarnings: number;
  todayDeliveries: number;
  totalDeliveries: number;
  averageRating: number;
  totalDistance: string;
  onlineTime: string;
  completionRate: number;
}

export default function DriverDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('San Pedro de Atacama');
  const [driverData, setDriverData] = useState<any>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Real Firebase data
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DriverStats>({
    todayEarnings: 0,
    todayDeliveries: 0,
    totalDeliveries: 0,
    averageRating: 0,
    totalDistance: '0 km',
    onlineTime: '0h 0m',
    completionRate: 0
  });
  const [cooksMap, setCooksMap] = useState<Map<string, Cook>>(new Map());
  const [dishesMap, setDishesMap] = useState<Map<string, Dish>>(new Map());

  // Load driver data on mount
  useEffect(() => {
    if (user) {
      loadDriverData();
    }
  }, [user]);

  const loadDriverData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading driver data for user:', user.uid);
      
      // Load driver profile
      let driver = await DriversService.getDriverById(user.uid);
      
      // If driver doesn't exist, create a basic profile
      if (!driver) {
        console.log('Driver profile not found, creating new profile for user:', user.uid);
        
        const newDriverData = {
          displayName: user.displayName || 'Conductor',
          email: user.email || '',
          avatar: user.photoURL || '',
          phone: '',
          vehicleType: 'car' as const,
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
        
        const driverId = await DriversService.createDriverProfile(newDriverData, user.uid);
        if (driverId) {
          driver = await DriversService.getDriverById(user.uid);
          console.log('Driver profile created and loaded:', driver);
        } else {
          console.error('Failed to create driver profile');
          return;
        }
      }
      
      console.log('Driver data loaded:', driver);
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

  const loadOrdersAndStats = async () => {
    if (!user) return;

    try {
      // TODO: Load driver orders when OrdersService methods are available
      // const driverOrders = await OrdersService.getOrdersByDriver(user.uid);
      // setOrders(driverOrders);
      
      // TODO: Load driver statistics when OrdersService methods are available
      // const driverStats = await OrdersService.getDriverStats(user.uid);
      
      // For now, use placeholder data
      const driverOrders: Order[] = [];
      setOrders(driverOrders);
      
      // Calculate additional stats
      const averageRating = driverData?.rating || 5.0;
      const onlineTime = calculateOnlineTime();
      const totalDistance = calculateTotalDistance(driverOrders);
      
      setStats((prev: DriverStats) => ({
        ...prev,
        averageRating,
        totalDistance,
        onlineTime
      }));
      
    } catch (error) {
      console.error('Error loading orders and stats:', error);
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

  const calculateOnlineTime = (): string => {
    // This would calculate based on driver's online/offline history
    // For now, return a placeholder
    return '6h 45m';
  };

  const calculateTotalDistance = (orders: Order[]): string => {
    // Calculate total distance from completed orders
    // For now, return a calculated estimate
    const completedOrders = orders.filter(order => order.status === 'delivered');
    const estimatedDistance = completedOrders.length * 3.5; // Average 3.5km per delivery
    return `${estimatedDistance.toFixed(1)} km`;
  };

  const handleToggleOnlineStatus = async () => {
    if (!user || isTogglingStatus) return;

    setIsTogglingStatus(true);

    try {
      const newStatus = !isOnline;
      console.log('Toggling driver status from', isOnline, 'to', newStatus, 'for user:', user.uid);
      
      // Request location permission if going online
      if (newStatus && 'geolocation' in navigator) {
        console.log('Requesting location permission...');
        const permissionGranted = await requestLocationPermission();
        if (!permissionGranted) {
          console.error('Location permission denied');
          toast.error('Se requiere acceso a la ubicación para conectarse');
          setIsTogglingStatus(false);
          return;
        }
        console.log('Location permission granted');
      }

      // Update driver status in Firebase
      console.log('Updating driver profile in Firebase...');
      const updateData = {
        isOnline: newStatus,
        isAvailable: newStatus, // Available when online
        lastLocationUpdate: new Date() as any
      };
      console.log('Update data:', updateData);
      
      const success = await DriversService.updateDriverProfile(user.uid, updateData);

      if (success) {
        console.log('Driver profile updated successfully');
        setIsOnline(newStatus);
        setDriverData(prev => prev ? { ...prev, isOnline: newStatus, isAvailable: newStatus } : null);
        
        toast.success(newStatus ? 'Te has conectado exitosamente' : 'Te has desconectado');
        
        // If going online, start location tracking
        if (newStatus) {
          getCurrentLocation();
      } else {
        console.error('Failed to create driver profile');
        return;
      }
    }
    
    console.log('Driver data loaded:', driver);
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

const loadOrdersAndStats = async () => {
  if (!user) return;

  try {
    // TODO: Load driver orders when OrdersService methods are available
    // const driverOrders = await OrdersService.getOrdersByDriver(user.uid);
    // setOrders(driverOrders);
    
    // TODO: Load driver statistics when OrdersService methods are available
    // const driverStats = await OrdersService.getDriverStats(user.uid);
    
    // For now, use placeholder data
    const driverOrders: Order[] = [];
    setOrders(driverOrders);
    
    // Calculate additional stats
    const averageRating = driverData?.rating || 5.0;
    const onlineTime = calculateOnlineTime();
    const totalDistance = calculateTotalDistance(driverOrders);
    
    setStats((prev: DriverStats) => ({
      ...prev,
      averageRating,
      totalDistance,
      onlineTime
    }));
    
  } catch (error) {
    console.error('Error loading orders and stats:', error);
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

const calculateOnlineTime = (): string => {
  // This would calculate based on driver's online/offline history
  // For now, return a placeholder
  return '6h 45m';
};

const calculateTotalDistance = (orders: Order[]): string => {
  // Calculate total distance from completed orders
  // For now, return a calculated estimate
  const completedOrders = orders.filter(order => order.status === 'delivered');
  const estimatedDistance = completedOrders.length * 3.5; // Average 3.5km per delivery
  return `${estimatedDistance.toFixed(1)} km`;
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
      setDriverData((prev: any) => ({ ...prev, isOnline: newStatus, isAvailable: newStatus }));
      
      if (newStatus) {
        toast.success('¡Estás en línea! Los pedidos comenzarán a aparecer.');
      } else {
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

const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
  setOrders((prev: Order[]) => prev.map((order: Order) => 
    order.id === orderId 
      ? { ...order, status: newStatus }
      : order
  ));
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

  const StatCard = ({ title, value, icon: Icon, trend, description, color = "text-primary" }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500">{trend}</span> {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const DeliveryCard = ({ delivery }: { delivery: Delivery }) => {
    const nextAction = getNextAction(delivery.status);
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{delivery.orderId}</h3>
                <Badge className={getStatusColor(delivery.status)}>
                  {getStatusText(delivery.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{delivery.customerName}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${delivery.total.toLocaleString('es-CL')}</p>
              <p className="text-sm text-muted-foreground">+${delivery.deliveryFee.toLocaleString('es-CL')} entrega</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{delivery.restaurantName}</p>
                <p className="text-muted-foreground">{delivery.restaurantAddress}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{delivery.customerName}</p>
                <p className="text-muted-foreground">{delivery.customerAddress}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Route className="h-4 w-4" />
              <span>{delivery.distance}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{delivery.estimatedTime}</span>
            </div>
          </div>
          
          {delivery.specialInstructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-yellow-800">
                <strong>Instrucciones:</strong> {delivery.specialInstructions}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Phone className="h-4 w-4 mr-1" />
              Llamar
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Navigation className="h-4 w-4 mr-1" />
              Navegar
            </Button>
            {nextAction && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => handleStatusUpdate(delivery.id, nextAction.nextStatus)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {nextAction.text}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return <div>Please log in to access the driver dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.photoURL || '/api/placeholder/50/50'} />
                <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'D'}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">¡Hola, {user.displayName || 'Conductor'}!</h1>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{currentLocation}</span>
                  <Button 
                    variant={isOnline ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleOnlineStatus}
                    disabled={isTogglingStatus}
                    className={isOnline ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {isTogglingStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Actualizando...
                      </>
                    ) : isOnline ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        En línea
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Desconectado
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => router.push('/driver/delivery-verification')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Verificar Entrega
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'deliveries', label: 'Entregas' },
            { id: 'earnings', label: 'Ganancias' },
            { id: 'history', label: 'Historial' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Location Tracking */}
            <DriverLocationTracker 
              isOnline={isOnline}
              onLocationUpdate={(location) => {
                console.log('Driver location updated:', location);
                // Update current location display
                if (location?.address?.city) {
                  setCurrentLocation(location.address.city);
                }
              }}
              onStatusChange={(isTracking) => {
                console.log('Location tracking status:', isTracking);
              }}
            />

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ganancias de Hoy</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45.230</div>
                  <p className="text-xs text-muted-foreground">
                    +12% desde ayer
                  </p>
                </CardContent>
              </Card>
              <StatCard
                title="Entregas Hoy"
                value={stats.todayDeliveries}
                icon={Package}
                trend="+3"
                description="vs ayer"
                color="text-blue-600"
              />
              <StatCard
                title="Calificación"
                value={stats.averageRating.toFixed(1)}
                icon={Star}
                trend="+0.1"
                description="esta semana"
                color="text-yellow-600"
              />
              <StatCard
                title="Distancia Hoy"
                value={stats.totalDistance}
                icon={Car}
                description="total recorrida"
                color="text-purple-600"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Estado Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {isOnline ? 'En línea' : 'Desconectado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo en línea:</span>
                      <span>{stats.onlineTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasa de finalización:</span>
                      <span>{stats.completionRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Entregas Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-orange-600">
                      {deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">entregas activas</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Promedio/hora:</span>
                      <span>$6,750</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entregas/hora:</span>
                      <span>1.8</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo promedio:</span>
                      <span>18 mins</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Entregas Activas</h2>
                <p className="text-muted-foreground">Gestiona tus entregas pendientes</p>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
            
            <div className="grid gap-4">
              {deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length > 0 ? (
                deliveries
                  .filter(d => d.status !== 'delivered' && d.status !== 'cancelled')
                  .map((delivery) => (
                    <DeliveryCard key={delivery.id} delivery={delivery} />
                  ))
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay entregas pendientes</h3>
                  <p className="text-muted-foreground">Las nuevas entregas aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Ganancias</h2>
              <p className="text-muted-foreground">Seguimiento de ingresos y pagos</p>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Ganancias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span>Hoy</span>
                      <span className="font-semibold text-green-600">${stats.todayEarnings.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span>Esta semana</span>
                      <span className="font-semibold">${(stats.todayEarnings * 5).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span>Este mes</span>
                      <span className="font-semibold">${(stats.todayEarnings * 22).toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Desglose de Ingresos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Tarifas de entrega</span>
                      <span>${(stats.todayEarnings * 0.7).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Propinas</span>
                      <span>${(stats.todayEarnings * 0.2).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonos</span>
                      <span>${(stats.todayEarnings * 0.1).toLocaleString('es-CL')}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${stats.todayEarnings.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Historial de Entregas</h2>
              <p className="text-muted-foreground">Entregas completadas y canceladas</p>
            </div>
            
            <div className="grid gap-4">
              {deliveries.filter(d => d.status === 'delivered' || d.status === 'cancelled').length > 0 ? (
                deliveries
                  .filter(d => d.status === 'delivered' || d.status === 'cancelled')
                  .map((delivery) => (
                    <Card key={delivery.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{delivery.orderId}</h3>
                              <Badge className={getStatusColor(delivery.status)}>
                                {getStatusText(delivery.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{delivery.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {delivery.deliveryTime?.toLocaleString('es-CL')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${delivery.total.toLocaleString('es-CL')}</p>
                            <p className="text-sm text-green-600">+${delivery.deliveryFee.toLocaleString('es-CL')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay historial aún</h3>
                  <p className="text-muted-foreground">Las entregas completadas aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
