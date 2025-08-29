import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Info, Utensils, DollarSign, Clock } from 'lucide-react';
import type { Order, Cook, Dish } from '@/lib/firebase/dataService';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  cooksMap: Map<string, Cook>;
  dishesMap: Map<string, Dish>;
  onAcceptOrder?: (orderId: string) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
  isDriverOnline: boolean;
  isOrderAssignedToDriver: boolean;
}

const getStatusText = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'Pendiente';
    case 'accepted': return 'Aceptado';
    case 'preparing': return 'Preparando';
    case 'ready': return 'Listo para recoger';
    case 'delivering': return 'En camino';
    case 'delivered': return 'Entregado';
    case 'cancelled': return 'Cancelado';
    default: return 'Desconocido';
  }
};

const getStatusColorClass = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'text-blue-600 bg-blue-100';
    case 'accepted': return 'text-yellow-600 bg-yellow-100';
    case 'preparing': return 'text-orange-600 bg-orange-100';
    case 'ready': return 'text-purple-600 bg-purple-100';
    case 'delivering': return 'text-indigo-600 bg-indigo-100';
    case 'delivered': return 'text-green-600 bg-green-100';
    case 'cancelled': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  cooksMap,
  dishesMap,
  onAcceptOrder,
  onUpdateOrderStatus,
  isDriverOnline,
  isOrderAssignedToDriver,
}) => {
  if (!order) {
    return null;
  }

  const cook = cooksMap.get(order.cookerId);
  const customerPhone = order.deliveryInfo.phone;

  const handleCallCustomer = () => {
    if (customerPhone) {
      window.open(`tel:${customerPhone}`);
    }
  };

  const handleNextStatus = () => {
    if (!onUpdateOrderStatus) return;

    let nextStatus: Order['status'] | null = null;
    switch (order.status) {
      case 'ready':
        nextStatus = 'delivering';
        break;
      case 'delivering':
        nextStatus = 'delivered';
        break;
      default:
        break;
    }
    if (nextStatus) {
      onUpdateOrderStatus(order.id, nextStatus);
    }
  };

  const getNextActionButtonText = () => {
    switch (order.status) {
      case 'ready': return 'Marcar como Recogido (En camino)';
      case 'delivering': return 'Marcar como Entregado';
      default: return null;
    }
  };

  const showAcceptButton = !isOrderAssignedToDriver && isDriverOnline && ['pending', 'accepted'].includes(order.status);
  const showNextActionButton = isOrderAssignedToDriver && ['ready', 'delivering'].includes(order.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-600">Detalles del Pedido #{order.id.substring(0, 8)}</DialogTitle>
          <DialogDescription>
            Información detallada sobre el pedido y acciones disponibles.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Order Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="text-lg font-semibold">Estado:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>

          {/* Customer Info */}
          <div className="flex items-center space-x-3">
            <MapPin className="text-gray-500" />
            <div>
              <p className="font-semibold">Cliente: {order.customerName}</p>
              <p className="text-sm text-gray-600">{order.deliveryInfo.address}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex items-center space-x-3">
            <Phone className="text-gray-500" />
            <p className="text-sm text-gray-600">{order.deliveryInfo.phone}</p>
            <Button variant="outline" size="sm" onClick={handleCallCustomer}>
              Llamar Cliente
            </Button>
          </div>

          {order.deliveryInfo.instructions && (
            <div className="flex items-start space-x-3">
              <Info className="text-gray-500 mt-1" />
              <div>
                <p className="font-semibold">Instrucciones de Entrega:</p>
                <p className="text-sm text-gray-600">{order.deliveryInfo.instructions}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Cooker Info */}
          <div className="flex items-center space-x-3">
            <Utensils className="text-gray-500" />
            <div>
              <p className="font-semibold">Cocinero: {cook?.displayName || 'Desconocido'}</p>
              <p className="text-sm text-gray-600">Dirección de Recogida: {cook?.location?.address?.fullAddress || 'No disponible'}</p>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Platos:</h3>
            <div className="space-y-2">
              {order.dishes.map((item, index) => {
                const dish = dishesMap.get(item.dishId);
                return (
                  <div key={index} className="flex justify-between items-center text-sm text-gray-700">
                    <span>{item.quantity}x {dish?.name || item.dishName}</span>
                    <span>${(item.quantity * item.price).toLocaleString('es-CL')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Pricing Summary */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Subtotal:</span>
              <span>${order.subtotal.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Costo de Envío:</span>
              <span>${order.deliveryFee.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Tarifa de Servicio:</span>
              <span>${order.serviceFee.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-orange-700 mt-2">
              <span>Total:</span>
              <span>${order.total.toLocaleString('es-CL')}</span>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Pedido Realizado: {order.orderTime?.toDate()?.toLocaleString('es-CL') || 'N/A'}</span>
            </div>
            {order.estimatedDeliveryTime && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Estimado de Entrega: {order.estimatedDeliveryTime?.toDate()?.toLocaleString('es-CL') || 'N/A'}</span>
              </div>
            )}
            {order.actualDeliveryTime && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Entregado: {order.actualDeliveryTime?.toDate()?.toLocaleString('es-CL') || 'N/A'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-4">
          {showAcceptButton && (
            <Button onClick={() => onAcceptOrder && onAcceptOrder(order.id)} className="w-full bg-green-500 hover:bg-green-600">
              Aceptar Pedido
            </Button>
          )}
          {showNextActionButton && (
            <Button onClick={handleNextStatus} className="w-full">
              {getNextActionButtonText()}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
