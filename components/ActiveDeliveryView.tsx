'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrdersService, CooksService, DishesService } from '@/lib/firebase/dataService';
import type { Order, Cook, Dish } from '@/lib/firebase/dataService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  Package, 
  CheckCircle,
  ArrowLeft,
  Timer,
  Route,
  User,
  ChefHat,
  Car
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import DeliveryMap from './DeliveryMap';
import { DeliveryTrackingService } from '@/lib/services/deliveryTrackingService';

interface ActiveDeliveryViewProps {
  activeOrder: Order;
  onBackToDashboard: () => void;
}

interface DeliveryStep {
  id: string;
  title: string;
  status: 'pending' | 'current' | 'completed';
  location?: {
    address: string;
    lat?: number;
    lng?: number;
  };
  action?: string;
  nextStatus?: Order['status'];
}

const ActiveDeliveryView = ({ activeOrder, onBackToDashboard }: ActiveDeliveryViewProps) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order>(activeOrder);
  const [cook, setCook] = useState<Cook | null>(null);
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState({
    pickup: '15 min',
    delivery: '25 min',
    total: '40 min'
  });
  const [locationTracking, setLocationTracking] = useState<{ stop: () => void } | null>(null);

  // Define delivery steps based on order status
  const getDeliverySteps = (): DeliveryStep[] => {
    const pickupLocation = cook ? {
      address: cook.location?.address?.fullAddress || 'Ubicación del cocinero',
      lat: cook.location?.coordinates?.latitude,
      lng: cook.location?.coordinates?.longitude
    } : { address: 'Cargando ubicación del cocinero...' };

    const deliveryLocation = {
      address: order.deliveryInfo.address,
      lat: undefined, // Would need geocoding
      lng: undefined
    };

    return [
      {
        id: 'accepted',
        title: 'Pedido Aceptado',
        status: order.status === 'accepted' ? 'current' : 'completed',
        action: 'Dirigirse al cocinero',
        nextStatus: 'preparing'
      },
      {
        id: 'pickup',
        title: 'Recoger Pedido',
        status: order.status === 'preparing' ? 'current' : 
               ['accepted'].includes(order.status) ? 'pending' : 'completed',
        location: pickupLocation,
        action: 'Confirmar recogida',
        nextStatus: 'delivering'
      },
      {
        id: 'delivery',
        title: 'Entregar al Cliente',
        status: order.status === 'delivering' ? 'current' : 
               ['accepted', 'preparing'].includes(order.status) ? 'pending' : 'completed',
        location: deliveryLocation,
        action: 'Confirmar entrega',
        nextStatus: 'delivered'
      },
      {
        id: 'completed',
        title: 'Entrega Completada',
        status: order.status === 'delivered' ? 'completed' : 'pending'
      }
    ];
  };

  useEffect(() => {
    loadOrderDetails();
    
    // Subscribe to order updates
    const unsubscribe = OrdersService.subscribeToOrderUpdates(order.cookerId, (orders) => {
      const updatedOrder = orders.find(o => o.id === order.id);
      if (updatedOrder) {
        setOrder(updatedOrder);
      }
    });

    // Start location tracking when component mounts
    if (user) {
      const tracking = DeliveryTrackingService.startLocationTracking(
        order.id,
        user.uid,
        user.displayName || user.email || 'Conductor',
        (location) => {
          // Update delivery tracking with current location
          const currentStepName = getCurrentStepName();
          DeliveryTrackingService.updateDeliveryTracking({
            orderId: order.id,
            driverId: user.uid,
            driverName: user.displayName || user.email || 'Conductor',
            currentLocation: {
              lat: location.lat,
              lng: location.lng,
              timestamp: new Date() as any
            },
            estimatedPickupTime: estimatedTime.pickup,
            estimatedDeliveryTime: estimatedTime.delivery,
            totalEstimatedTime: estimatedTime.total,
            currentStep: currentStepName
          });
        }
      );
      setLocationTracking(tracking);
    }

    return () => {
      unsubscribe();
      locationTracking?.stop();
    };
  }, [order.id, order.cookerId]);

  useEffect(() => {
    // Update current step based on order status
    const steps = getDeliverySteps();
    const currentStepIndex = steps.findIndex(step => step.status === 'current');
    setCurrentStep(currentStepIndex >= 0 ? currentStepIndex : steps.length - 1);

    // Update delivery step in tracking service
    if (user) {
      DeliveryTrackingService.updateDeliveryStep(order.id, getCurrentStepName());
    }
  }, [order.status]);

  const getCurrentStepName = (): 'heading_to_pickup' | 'at_pickup' | 'heading_to_delivery' | 'delivered' => {
    switch (order.status) {
      case 'accepted':
        return 'heading_to_pickup';
      case 'preparing':
        return 'at_pickup';
      case 'delivering':
        return 'heading_to_delivery';
      case 'delivered':
        return 'delivered';
      default:
        return 'heading_to_pickup';
    }
  };

  const loadOrderDetails = async () => {
    try {
      // Load cook and dish details
      const [cookData, dishData] = await Promise.all([
        CooksService.getCookById(order.cookerId),
        DishesService.getDishById(order.dishes[0]?.dishId || '')
      ]);
      
      setCook(cookData);
      setDish(dishData);
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const success = await OrdersService.updateOrderStatus(order.id, newStatus);
      if (success) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        
        const statusMessages = {
          preparing: 'Te diriges al cocinero',
          delivering: 'Pedido recogido, dirigiéndote al cliente',
          delivered: 'Entrega completada exitosamente'
        };
        
        toast.success(statusMessages[newStatus as keyof typeof statusMessages] || 'Estado actualizado');
        
        if (newStatus === 'delivered') {
          setTimeout(() => {
            onBackToDashboard();
          }, 2000);
        }
      } else {
        toast.error('Error al actualizar el estado del pedido');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error al actualizar el estado del pedido');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise<{lat: number, lng: number}>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const steps = getDeliverySteps();
  const currentStepData = steps[currentStep];
  const isCompleted = order.status === 'delivered';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBackToDashboard}
                className="text-primary-foreground hover:bg-primary/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold">Entrega Activa</h1>
                <p className="text-sm opacity-90">Pedido #{order.id.slice(-8)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{formatPrice(order.total)}</div>
              <div className="text-sm opacity-90">ETA: {estimatedTime.total}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Order Details & Steps */}
          <div className="space-y-6">
            {/* Current Step Card */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentStepData?.status === 'current' && <Timer className="h-5 w-5 text-primary" />}
                  {currentStepData?.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {currentStepData?.title || 'Paso Actual'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStepData?.location && (
                  <div className="mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-medium">Destino:</p>
                        <p className="text-sm text-muted-foreground">
                          {currentStepData.location.address}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentStepData?.action && currentStepData.nextStatus && !isCompleted && (
                  <Button 
                    onClick={() => handleStatusUpdate(currentStepData.nextStatus!)}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        {currentStepData.action}
                      </>
                    )}
                  </Button>
                )}

                {isCompleted && (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">¡Entrega Completada!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        step.status === 'completed' 
                          ? 'bg-green-500 text-white' 
                          : step.status === 'current'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          step.status === 'current' ? 'text-primary' : ''
                        }`}>
                          {step.title}
                        </p>
                        {step.location && (
                          <p className="text-xs text-muted-foreground">
                            {step.location.address}
                          </p>
                        )}
                      </div>
                      {step.status === 'current' && (
                        <Badge variant="default">Actual</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dish Info */}
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{dish?.name || 'Cargando...'}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {order.dishes[0]?.quantity || 1}
                    </p>
                  </div>
                </div>

                {/* Cook Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={cook?.avatar} />
                    <AvatarFallback>
                      <ChefHat className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{cook?.displayName || 'Cargando...'}</p>
                    <p className="text-sm text-muted-foreground">Cocinero</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {order.deliveryInfo.phone}
                    </div>
                  </div>
                </div>

                {order.deliveryInfo.instructions && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Instrucciones especiales:
                    </p>
                    <p className="text-sm text-yellow-700">
                      {order.deliveryInfo.instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Map */}
          <div className="space-y-6">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  {currentStepData?.location ? 'Navegación' : 'Ubicación'}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <DeliveryMap 
                  order={order}
                  cook={cook}
                  currentStep={currentStep}
                  onLocationUpdate={(eta) => {
                    setEstimatedTime(prev => ({ ...prev, ...eta }));
                    // Update ETA in tracking service
                    if (user) {
                      DeliveryTrackingService.updateETA(order.id, eta);
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12">
                <Phone className="h-4 w-4 mr-2" />
                Llamar Cliente
              </Button>
              <Button variant="outline" className="h-12">
                <Phone className="h-4 w-4 mr-2" />
                Llamar Cocinero
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveDeliveryView;