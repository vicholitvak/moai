'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrdersService, Order, DishesService } from '@/lib/firebase/dataService';
import { 
  calculateOrderPreparationTime, 
  calculateProgressPercentage, 
  formatTimeRemaining,
  getEstimatedReadyTime,
  formatPrice 
} from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Utensils, 
  CheckCircle,
  AlertCircle,
  Package,
  Timer,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DeliveryFeedProps {
  onOrderAccepted?: (orderId: string) => void;
  hasActiveDelivery?: boolean;
  isDriverOnline?: boolean;
}

const DeliveryFeed = ({ onOrderAccepted, hasActiveDelivery = false, isDriverOnline = false }: DeliveryFeedProps) => {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = OrdersService.subscribeToAvailableOrders((orders) => {
      // Filter out orders that already have a driver assigned
      const unassignedOrders = orders.filter(order => !order.driverId);
      setAvailableOrders(unassignedOrders);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'accepted': return 'Aceptado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo para entrega';
      default: return status;
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Utensils className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;

    setAcceptingOrder(orderId);

    try {
      const success = await OrdersService.assignOrderToDriver(orderId, user.uid);
      
      if (success) {
        toast.success('Pedido aceptado exitosamente');
        onOrderAccepted?.(orderId);
      } else {
        toast.error('Error al aceptar el pedido');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Error al aceptar el pedido');
    } finally {
      setAcceptingOrder(null);
    }
  };

  const calculateOrderProgress = (order: Order) => {
    if (!order.createdAt) return { progress: 0, timeRemaining: 'Calculando...', totalPrepTime: 30 };

    // Calculate preparation time from the dishes
    const dishesWithPrepTime = order.dishes.map(dish => ({
      prepTime: dish.prepTime || '30 min',
      quantity: dish.quantity
    }));
    
    const totalPrepTime = calculateOrderPreparationTime(dishesWithPrepTime);
    const startTime = order.createdAt?.toDate() || new Date();
    const progress = calculateProgressPercentage(startTime, totalPrepTime);
    const timeRemaining = formatTimeRemaining(startTime, totalPrepTime);

    return { progress, timeRemaining, totalPrepTime };
  };

  if (!isDriverOnline) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Estás fuera de línea</h3>
          <p className="text-muted-foreground">
            Activa tu estado en línea para ver pedidos disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasActiveDelivery) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Navigation className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Entrega en progreso</h3>
          <p className="text-muted-foreground">
            Completa tu entrega actual antes de aceptar nuevos pedidos
          </p>
        </CardContent>
      </Card>
    );
  }

  if (availableOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay entregas disponibles</h3>
          <p className="text-muted-foreground">
            Los nuevos pedidos aparecerán aquí automáticamente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Entregas Disponibles</h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {availableOrders.length} disponibles
        </Badge>
      </div>

      {availableOrders.map((order) => {
        const { progress, timeRemaining, totalPrepTime } = calculateOrderProgress(order);
        const isReady = progress >= 100 || order.status === 'ready';

        return (
          <Card key={order.id} className={`transition-all duration-200 ${isReady ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Pedido #{order.id.slice(-8)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    {order.customerName}
                    <span className="text-muted-foreground">•</span>
                    {order.createdAt?.toDate().toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(order.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </div>
                  </Badge>
                  <div className="text-lg font-bold mt-1">{formatPrice(order.total)}</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Preparation Progress */}
              <div className="bg-white p-4 rounded-lg border">
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

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Platos ({order.dishes.length})
                </h4>
                <div className="bg-muted p-3 rounded-lg space-y-1">
                  {order.dishes.map((dish, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{dish.dishName} x {dish.quantity}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {dish.prepTime || '30 min'}
                        </span>
                        <span className="font-medium">{formatPrice(dish.price * dish.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="text-sm font-medium block">Dirección:</span>
                    <span className="text-sm text-muted-foreground">
                      {order.deliveryInfo.address}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium block">Teléfono:</span>
                    <span className="text-sm text-muted-foreground">
                      {order.deliveryInfo.phone}
                    </span>
                  </div>
                </div>
              </div>

              {order.deliveryInfo.instructions && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-yellow-800">Instrucciones especiales:</span>
                      <p className="text-sm text-yellow-700 mt-1">
                        {order.deliveryInfo.instructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Accept Button */}
              <Button 
                onClick={() => handleAcceptOrder(order.id)}
                disabled={acceptingOrder === order.id || hasActiveDelivery || !isDriverOnline}
                className={`w-full ${isReady ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                size="lg"
              >
                {acceptingOrder === order.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Aceptando...
                  </>
                ) : hasActiveDelivery ? (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Entrega en progreso
                  </>
                ) : !isDriverOnline ? (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Actívate en línea
                  </>
                ) : (
                  <>
                    <Navigation className="h-5 w-5 mr-2" />
                    {isReady ? 'Recoger Pedido' : 'Aceptar Entrega'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DeliveryFeed;