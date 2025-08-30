'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { OrdersService, DishesService } from '@/lib/firebase/dataService';
import { Timestamp } from 'firebase/firestore';
import { NotificationService } from '@/lib/services/notificationService';
import { 
  ArrowLeft,
  Package,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle,
  Truck,
  ChefHat,
  AlertCircle,
  MessageSquare,
  Copy,
  Share2,
  Star,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ReviewSystem } from '@/components/reviews/ReviewSystem';

// Dynamically import the map component to avoid SSR issues
const RealTimeMap = dynamic(() => import('@/components/ui/real-time-map'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground">Cargando mapa...</p>
      </div>
    </div>
  )
});

// Order status configuration
const orderStatusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'yellow', 
    icon: Clock,
    description: 'Tu pedido está esperando confirmación del cocinero'
  },
  accepted: { 
    label: 'Aceptado', 
    color: 'blue', 
    icon: CheckCircle,
    description: 'El cocinero ha aceptado tu pedido'
  },
  preparing: { 
    label: 'Preparando', 
    color: 'orange', 
    icon: ChefHat,
    description: 'Tu pedido está siendo preparado con amor'
  },
  ready: { 
    label: 'Listo', 
    color: 'green', 
    icon: Package,
    description: '¡Tu pedido está listo para ser recogido!'
  },
  delivering: { 
    label: 'En camino', 
    color: 'purple', 
    icon: Truck,
    description: 'Tu pedido está en camino hacia ti'
  },
  en_viaje: { 
    label: 'En viaje', 
    color: 'blue', 
    icon: Truck,
    description: 'El repartidor está en camino. Puedes seguir su ubicación en tiempo real'
  },
  delivered: { 
    label: 'Entregado', 
    color: 'green', 
    icon: CheckCircle,
    description: '¡Tu pedido ha sido entregado exitosamente!'
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'red', 
    icon: AlertCircle,
    description: 'Este pedido ha sido cancelado'
  }
};

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [estimatedTime, setEstimatedTime] = useState(45);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (!user || !orderId) {
      router.push('/login');
      return;
    }
    
    fetchOrderDetails();
    const unsubscribe = setupRealtimeTracking();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId, user]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await OrdersService.getOrderById(orderId as string);
      
      if (!orderData) {
        toast.error('Pedido no encontrado');
        const isAdmin = user?.email === 'admin@moai.com' || user?.email?.includes('admin');
        router.push(isAdmin ? '/admin/dashboard' : '/client/home');
        return;
      }
      
      // Verify the order belongs to the current user or user is admin
      const isAdmin = user?.email === 'admin@moai.com' || user?.email?.includes('admin');
      if (orderData.customerId !== user?.uid && !isAdmin) {
        toast.error('No tienes permiso para ver este pedido');
        router.push(isAdmin ? '/admin/dashboard' : '/client/home');
        return;
      }
      
      setOrder(orderData);
      setDeliveryCode(orderData.deliveryCode || generateDeliveryCode());
      
      // Show review form if order is delivered and not reviewed
      if (orderData.status === 'delivered' && !orderData.reviewed) {
        setShowReviewForm(true);
      }
      
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeTracking = () => {
    if (!orderId) return;
    
    return OrdersService.subscribeToOrder(orderId as string, (updatedOrder) => {
      setOrder(updatedOrder);
      
      // Show notification on status change
      if (updatedOrder && updatedOrder.status !== order?.status) {
        NotificationService.notifyOrderStatusChange(
          updatedOrder.id,
          updatedOrder.status,
          'customer'
        );
        
        // Update estimated time based on status
        updateEstimatedTime(updatedOrder.status);
      }
      
      // Update driver location if delivering
      if (updatedOrder && updatedOrder.status === 'delivering' && updatedOrder.driverLocation) {
        setDriverLocation(updatedOrder.driverLocation);
      }
    });
  };

  const updateEstimatedTime = (status: string) => {
    const timeMap: { [key: string]: number } = {
      pending: 45,
      accepted: 40,
      preparing: 30,
      ready: 15,
      delivering: 10,
      delivered: 0
    };
    setEstimatedTime(timeMap[status] || 45);
  };

  const generateDeliveryCode = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  const copyDeliveryCode = () => {
    navigator.clipboard.writeText(deliveryCode);
    toast.success('Código copiado al portapapeles');
  };

  const shareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: `Pedido #${order.id.slice(-6)}`,
        text: `Mi pedido de Moai está ${orderStatusConfig[order.status as keyof typeof orderStatusConfig].label}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const submitReview = async () => {
    if (!rating || !order) return;
    
    try {
      await OrdersService.addOrderReview(order.id, {
        rating,
        comment: review,
        customerId: user!.uid,
        customerName: user!.displayName || 'Cliente',
        createdAt: new Date()
      });
      
      toast.success('¡Gracias por tu reseña!');
      setShowReviewForm(false);
      
      // Update order to mark as reviewed
      await OrdersService.updateOrder(order.id, { reviewed: true });
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Error al enviar la reseña');
    }
  };

  const getOrderProgress = () => {
    const statusOrder = ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered'];
    const currentIndex = statusOrder.indexOf(order?.status || 'pending');
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const cancelOrder = async () => {
    if (!order || order.status !== 'pending') return;
    
    try {
      await OrdersService.updateOrder(order.id, { 
        status: 'cancelled',
        cancelledAt: Timestamp.now()
      });
      
      toast.success('Pedido cancelado exitosamente');
      router.push('/client/home');
      
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Error al cancelar el pedido');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pedido no encontrado</h2>
            <p className="text-muted-foreground mb-4">
              No pudimos encontrar el pedido que buscas
            </p>
            <Button onClick={() => {
              const isAdmin = user?.email === 'admin@moai.com' || user?.email?.includes('admin');
              router.push(isAdmin ? '/admin/dashboard' : '/client/home');
            }}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = orderStatusConfig[order.status as keyof typeof orderStatusConfig]?.icon || Clock;
  const statusInfo = orderStatusConfig[order.status as keyof typeof orderStatusConfig];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Pedido #{order.id.slice(-6)}</h1>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt?.toDate()).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={shareOrder}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              {order.status === 'pending' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={cancelOrder}
                >
                  Cancelar pedido
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-6 w-6 text-${statusInfo?.color}-500`} />
                    <div>
                      <CardTitle>{statusInfo?.label}</CardTitle>
                      <CardDescription>{statusInfo?.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={statusInfo?.color === 'green' ? 'default' : 'secondary'}>
                    {statusInfo?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={getOrderProgress()} className="mb-4" />
                
                {(order.status === 'delivering' || order.status === 'en_viaje') && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-primary/10 border border-primary/20 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Tiempo estimado de llegada</span>
                        <span className="text-2xl font-bold">{estimatedTime} min</span>
                      </div>
                      {driverLocation && (
                        <div className="text-sm text-muted-foreground">
                          <MapPin className="inline h-4 w-4 mr-1" />
                          El repartidor está cerca de tu ubicación
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Real-time map for tracking */}
                {order.status === 'en_viaje' && order.deliveryInfo && (
                  <div className="mt-4">
                    <RealTimeMap
                      orderId={order.id}
                      customerLocation={{
                        lat: -33.4489, // Santiago coordinates - you'll need to geocode the address
                        lng: -70.6693,
                        address: order.deliveryInfo.address
                      }}
                      estimatedTime={estimatedTime}
                      onTrackingUpdate={(tracking) => {
                        // Update estimated time based on tracking info
                        if (tracking.route?.duration) {
                          const minutes = parseInt(tracking.route.duration.replace(/\D/g, ''));
                          if (minutes) setEstimatedTime(minutes);
                        }
                      }}
                    />
                  </div>
                )}
                
                {order.status === 'delivered' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">¡Pedido entregado exitosamente!</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del pedido</CardTitle>
                <CardDescription>{order.dishes?.length || 0} items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.dishes?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.dishName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity} • {formatPrice(item.price)} c/u
                        </p>
                      </div>
                      <span className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery</span>
                      <span>{formatPrice(order.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tarifa de servicio</span>
                      <span>{formatPrice(order.serviceFee)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review System */}
            {showReviewForm && order.status === 'delivered' && (
              <ReviewSystem 
                cookerId={order.cookerId}
                orderId={order.id}
                dishName={order.dishes?.[0]?.dishName || 'Pedido'}
                onReviewSubmit={async () => {
                  setShowReviewForm(false);
                  await OrdersService.updateOrder(order.id, { reviewed: true });
                  toast.success('¡Gracias por tu reseña!');
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Code */}
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Código de entrega</CardTitle>
                  <CardDescription>
                    Comparte este código con el repartidor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold tracking-wider mb-2">
                      {deliveryCode}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyDeliveryCode}
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar código
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dirección</p>
                    <p className="text-sm text-muted-foreground">
                      {order.deliveryInfo?.address || 'No especificada'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">
                      {order.deliveryInfo?.phone || 'No especificado'}
                    </p>
                  </div>
                </div>
                
                {order.deliveryInfo?.instructions && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Instrucciones</p>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryInfo.instructions}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Método de pago</p>
                    <p className="text-sm text-muted-foreground">
                      MercadoPago - Pagado
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Estado del pago</p>
                    <p className="text-sm text-green-600">Completado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Info (if delivering) */}
            {order.status === 'delivering' && order.driverInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tu repartidor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarImage src={order.driverInfo.avatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{order.driverInfo.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{order.driverInfo.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar al repartidor
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Necesitas ayuda?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat de soporte
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar a soporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;