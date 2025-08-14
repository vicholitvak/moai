'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OrdersService, type Order } from '@/lib/firebase/dataService';
import { CashOrderService } from '@/lib/services/cashOrderService';
import { OrderApprovalService } from '@/lib/services/orderApprovalService';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  Phone,
  Banknote,
  CreditCard,
  AlertCircle,
  MessageSquare,
  Timer,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPrice } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderApprovalProps {
  className?: string;
}

export default function OrderApproval({ className }: OrderApprovalProps) {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [estimatedTimes, setEstimatedTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = OrdersService.subscribeToOrdersByCook(user.uid, (orders) => {
      const pending = orders.filter(order => 
        order.status === 'pending_approval'
      );
      setPendingOrders(pending);
      
      // Initialize estimated times for new orders
      pending.forEach(order => {
        if (!estimatedTimes[order.id]) {
          setEstimatedTimes(prev => ({
            ...prev,
            [order.id]: 30 // Default 30 minutes
          }));
        }
      });
      
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  const handleApprove = async (orderId: string) => {
    if (!user?.uid) return;

    const estimatedTime = estimatedTimes[orderId] || 30;
    setProcessingOrders(prev => new Set(prev).add(orderId));

    try {
      const success = await OrderApprovalService.approveOrder(orderId, user.uid, estimatedTime);
      
      if (success) {
        const order = pendingOrders.find(o => o.id === orderId);
        const paymentText = order?.paymentMethod === 'card' ? 'El pago digital ha sido procesado.' : 'Cobrar en efectivo al entregar.';
        
        toast.success('¡Orden aprobada!', {
          description: `La orden ha sido aceptada. ${paymentText} Tiempo estimado: ${estimatedTime} min.`,
          duration: 5000
        });
      } else {
        throw new Error('Failed to approve order');
      }
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Error al aprobar la orden. Intenta nuevamente.');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleReject = async (orderId: string) => {
    if (!user?.uid) return;

    const reason = rejectionReasons[orderId] || '';
    
    if (!reason.trim()) {
      toast.error('Por favor, proporciona una razón para el rechazo.');
      return;
    }

    setProcessingOrders(prev => new Set(prev).add(orderId));

    try {
      const success = await OrderApprovalService.rejectOrder(orderId, user.uid, reason);
      
      if (success) {
        const order = pendingOrders.find(o => o.id === orderId);
        const refundText = order?.paymentMethod === 'card' ? ' El reembolso se procesará automáticamente.' : '';
        
        toast.success('Orden rechazada', {
          description: `Se ha notificado al cliente sobre el rechazo.${refundText}`,
          duration: 5000
        });
        
        // Clear the rejection reason and estimated time
        setRejectionReasons(prev => {
          const newReasons = { ...prev };
          delete newReasons[orderId];
          return newReasons;
        });
        
        setEstimatedTimes(prev => {
          const newTimes = { ...prev };
          delete newTimes[orderId];
          return newTimes;
        });
      } else {
        throw new Error('Failed to reject order');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Error al rechazar la orden. Intenta nuevamente.');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const updateRejectionReason = (orderId: string, reason: string) => {
    setRejectionReasons(prev => ({
      ...prev,
      [orderId]: reason
    }));
  };

  const updateEstimatedTime = (orderId: string, time: number) => {
    setEstimatedTimes(prev => ({
      ...prev,
      [orderId]: time
    }));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Órdenes Pendientes de Aprobación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-orange-500" />
            Órdenes Pendientes de Aprobación
          </CardTitle>
          <CardDescription>
            Órdenes con pago en efectivo que requieren tu aprobación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No hay órdenes pendientes
            </h3>
            <p className="text-muted-foreground">
              Todas las órdenes en efectivo han sido procesadas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Órdenes Pendientes de Aprobación
          <Badge variant="destructive" className="ml-auto">
            {pendingOrders.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Revisa y aprueba órdenes (pago digital y efectivo). Define tiempo de preparación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingOrders.map((order) => (
          <Card key={order.id} className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 text-white p-2 rounded-full">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      Orden #{order.id.slice(-6).toUpperCase()}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(order.createdAt.toDate(), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-orange-600">
                    {formatPrice(order.total)}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${
                      order.paymentMethod === 'card' 
                        ? 'border-blue-300 text-blue-700 bg-blue-50' 
                        : 'border-orange-300 text-orange-700 bg-orange-50'
                    }`}
                  >
                    {order.paymentMethod === 'card' ? (
                      <>
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pago Digital
                      </>
                    ) : (
                      <>
                        <Banknote className="h-3 w-3 mr-1" />
                        Pago en Efectivo
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.deliveryInfo.phone}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Dirección de entrega:</div>
                      <div className="text-sm text-muted-foreground">
                        {order.deliveryInfo.address}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h5 className="font-medium mb-2">Platos pedidos:</h5>
                <div className="space-y-1">
                  {order.dishes.map((dish, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>
                        {dish.quantity}x {dish.dishName}
                      </span>
                      <span className="font-medium">
                        {formatPrice(dish.price * dish.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total a cobrar:</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {order.deliveryInfo.instructions && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-900">
                        Instrucciones especiales:
                      </div>
                      <div className="text-sm text-blue-700">
                        {order.deliveryInfo.instructions}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Estimated Preparation Time */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="h-4 w-4 text-green-600" />
                  <Label className="text-sm font-medium text-green-900">
                    Tiempo estimado de preparación:
                  </Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    value={estimatedTimes[order.id]?.toString() || "30"}
                    onValueChange={(value) => updateEstimatedTime(order.id, parseInt(value))}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar tiempo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="20">20 minutos</SelectItem>
                      <SelectItem value="25">25 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="40">40 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="75">1 hora 15 min</SelectItem>
                      <SelectItem value="90">1 hora 30 min</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Clock className="h-3 w-3" />
                    <span>
                      Entrega aprox: {new Date(Date.now() + (estimatedTimes[order.id] || 30) * 60000).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rejection Reason Input */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`rejection-reason-${order.id}`} className="text-sm font-medium">
                    Razón de rechazo (opcional, pero recomendado):
                  </Label>
                  <Textarea
                    id={`rejection-reason-${order.id}`}
                    placeholder="Ej: No tengo todos los ingredientes disponibles..."
                    value={rejectionReasons[order.id] || ''}
                    onChange={(e) => updateRejectionReason(order.id, e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(order.id)}
                    disabled={processingOrders.has(order.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processingOrders.has(order.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprobar Orden
                  </Button>
                  <Button
                    onClick={() => handleReject(order.id)}
                    disabled={processingOrders.has(order.id) || !rejectionReasons[order.id]?.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processingOrders.has(order.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Rechazar
                  </Button>
                </div>
              </div>

              {/* Warning */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <strong>Importante:</strong> Una vez aprobada la orden, el cliente esperará que comiences la preparación. 
                    {order.paymentMethod === 'card' && (
                      <span> Para pagos digitales, el dinero se liberará automáticamente.</span>
                    )}
                    {order.paymentMethod === 'cash_on_delivery' && (
                      <span> Para pagos en efectivo, cobrar al momento de la entrega.</span>
                    )}
                    {' '}Si la rechazas, se le notificará inmediatamente
                    {order.paymentMethod === 'card' && ' y se procesará el reembolso'}.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}