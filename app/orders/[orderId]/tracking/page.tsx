'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { OrdersService, CooksService, DriversService } from '@/lib/firebase/dataService';
import { DeliveryTrackingService } from '@/lib/services/deliveryTrackingService';
import type { Order, Cook, Driver, DeliveryTracking } from '@/lib/firebase/dataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  ChefHat, 
  Truck, 
  Package,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Copy,
  Navigation,
  Star,
  Timer,
  AlertCircle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import LiveDeliveryMap from '@/components/LiveDeliveryMap';
import OrderProgressTracker from '@/components/OrderProgressTracker';
import { useDeliveryNotifications } from '@/hooks/useOrderNotifications';

interface OrderTrackingPageProps {}

export default function OrderTrackingPage({}: OrderTrackingPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [cook, setCook] = useState<Cook | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [deliveryTracking, setDeliveryTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enable delivery notifications for this specific order
  useDeliveryNotifications(orderId, !!user && !!order);

  useEffect(() => {
    if (!user || !orderId) return;
    
    loadOrderData();
    
    // Subscribe to order updates
    const unsubscribeOrder = OrdersService.subscribeToOrderUpdates(user.uid, (orders) => {
      const updatedOrder = orders.find(o => o.id === orderId);
      if (updatedOrder) {
        setOrder(updatedOrder);
        // Load cook and driver data when order updates
        if (updatedOrder.cookerId) {
          loadCookData(updatedOrder.cookerId);
        }
        if (updatedOrder.driverId) {
          loadDriverData(updatedOrder.driverId);
        }
      }
    });

    // Subscribe to delivery tracking if order is being delivered
    let unsubscribeTracking: (() => void) | null = null;
    if (order && ['delivering', 'ready'].includes(order.status)) {
      unsubscribeTracking = DeliveryTrackingService.subscribeToDeliveryTracking(
        orderId,
        (tracking) => {
          setDeliveryTracking(tracking);
        }
      );
    }

    return () => {
      unsubscribeOrder();
      if (unsubscribeTracking) {
        unsubscribeTracking();
      }
    };
  }, [user, orderId, order?.status]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const orderData = await OrdersService.getOrderById(orderId);
      if (!orderData) {
        setError('Pedido no encontrado');
        return;
      }
      
      // Verify user owns this order
      if (orderData.customerId !== user?.uid) {
        setError('No tienes permisos para ver este pedido');
        return;
      }
      
      setOrder(orderData);
      
      // Load related data
      if (orderData.cookerId) {
        await loadCookData(orderData.cookerId);
      }
      if (orderData.driverId) {
        await loadDriverData(orderData.driverId);
      }
      
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const loadCookData = async (cookerId: string) => {
    try {
      const cookData = await CooksService.getCookById(cookerId);
      setCook(cookData);
    } catch (error) {
      console.error('Error loading cook data:', error);
    }
  };

  const loadDriverData = async (driverId: string) => {
    try {
      const driverData = await DriversService.getDriverById(driverId);
      setDriver(driverData);
    } catch (error) {
      console.error('Error loading driver data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrderData();
    setRefreshing(false);
    toast.success('Información actualizada');
  };

  const copyDeliveryCode = () => {
    if (order?.deliveryCode) {
      navigator.clipboard.writeText(order.deliveryCode);
      toast.success('Código copiado al portapapeles');
    }
  };

  const getEstimatedDeliveryTime = () => {
    if (deliveryTracking?.totalEstimatedTime) {
      return deliveryTracking.totalEstimatedTime;
    }
    if (order?.estimatedDeliveryTime) {
      return order.estimatedDeliveryTime.toDate().toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Calculando...';
  };

  const getStatusMessage = () => {
    if (!order) return '';
    
    switch (order.status) {
      case 'pending':
        return 'Esperando confirmación del cocinero';
      case 'accepted':
        return 'Pedido confirmado, preparación iniciará pronto';
      case 'preparing':
        return cook?.displayName ? `${cook.displayName} está preparando tu pedido` : 'Tu pedido se está preparando';
      case 'ready':
        return order.isSelfDelivery ? 'Listo para recoger' : 'Buscando conductor para la entrega';
      case 'delivering':
        return driver?.displayName ? `${driver.displayName} está en camino` : 'Tu pedido está en camino';
      case 'delivered':
        return '¡Pedido entregado exitosamente!';
      case 'cancelled':
        return 'Pedido cancelado';
      default:
        return 'Estado desconocido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información del pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error || 'Pedido no encontrado'}</p>
          <Button onClick={() => router.push('/client/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mis pedidos
          </Button>
        </div>
      </div>
    );
  }

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
                onClick={() => router.push('/client/orders')}
                className="text-primary-foreground hover:bg-primary/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Mis Pedidos
              </Button>
              <div>
                <h1 className="text-xl font-bold">Seguimiento de Pedido</h1>
                <p className="text-sm opacity-90">#{order.id.slice(-8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-primary-foreground hover:bg-primary/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Progress & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Estado del Pedido
                </CardTitle>
                <CardDescription>{getStatusMessage()}</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderProgressTracker 
                  currentStatus={order.status}
                  orderTime={order.createdAt}
                  estimatedDelivery={getEstimatedDeliveryTime()}
                />
              </CardContent>
            </Card>

            {/* Live Map - Show when order is being delivered */}
            {(order.status === 'delivering' || order.status === 'ready') && deliveryTracking && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Seguimiento en Tiempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <LiveDeliveryMap
                    order={order}
                    cook={cook}
                    deliveryTracking={deliveryTracking}
                    className="h-[400px] rounded-b-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.dishes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium">{item.dishName}</p>
                      <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground italic">Nota: {item.notes}</p>
                      )}
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Cook & Driver Info */}
          <div className="space-y-6">
            {/* Delivery Code - Show when order is ready/delivering */}
            {(['ready', 'delivering'].includes(order.status)) && order.deliveryCode && (
              <Card className="border-moai-orange bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-moai-orange">Código de Entrega</CardTitle>
                  <CardDescription>Comparte este código con el conductor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-moai-orange mb-2 font-mono tracking-wider">
                      {order.deliveryCode.slice(0, 2)}-{order.deliveryCode.slice(2)}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyDeliveryCode}
                      className="text-moai-orange border-moai-orange hover:bg-moai-orange hover:text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Código
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cook Information */}
            {cook && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Tu Cocinero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={cook.avatar} />
                      <AvatarFallback>
                        <ChefHat className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{cook.displayName}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">
                          {cook.rating.toFixed(1)} ({cook.reviewCount} reseñas)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{cook.location?.address?.fullAddress || 'Ubicación no disponible'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{cook.totalOrders} pedidos completados</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contactar Cocinero
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Driver Information */}
            {driver && order.status === 'delivering' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tu Conductor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={driver.avatar} />
                      <AvatarFallback>
                        <Truck className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{driver.displayName}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">
                          {driver.rating.toFixed(1)} ({driver.reviewCount || 0} reseñas)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span>{driver.vehicleType} - {driver.vehicleInfo?.make} {driver.vehicleInfo?.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{driver.totalDeliveries} entregas completadas</span>
                    </div>
                    {deliveryTracking?.estimatedDeliveryTime && (
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span>ETA: {deliveryTracking.estimatedDeliveryTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Llamar Conductor
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Enviar Mensaje
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{order.deliveryInfo.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.deliveryInfo.phone}</span>
                </div>
                {order.deliveryInfo.instructions && (
                  <div className="flex items-start gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{order.deliveryInfo.instructions}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Pedido realizado: {order.createdAt.toDate().toLocaleString('es-CL')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}