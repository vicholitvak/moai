'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowLeft, Receipt, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MercadoPagoService } from '@/lib/services/mercadoPagoService';
import { OrderApprovalService } from '@/lib/services/orderApprovalService';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ordersCreated, setOrdersCreated] = useState(false);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const isHoldMode = searchParams.get('hold') === 'true';

  useEffect(() => {
    const fetchPaymentDataAndCreateOrders = async () => {
      if (paymentId) {
        try {
          const data = await MercadoPagoService.getPaymentStatus(paymentId);
          setPaymentData(data);

          // If this is a hold mode payment and payment is authorized, create orders
          if (isHoldMode && (data.status === 'authorized' || data.status === 'approved') && !ordersCreated) {
            await createOrdersFromStoredData(paymentId);
            setOrdersCreated(true);
          }
        } catch (error) {
          console.error('Error fetching payment data:', error);
        }
      }
      setLoading(false);
    };

    fetchPaymentDataAndCreateOrders();
  }, [paymentId, isHoldMode, ordersCreated]);

  const createOrdersFromStoredData = async (authorizedPaymentId: string) => {
    try {
      const storedData = sessionStorage.getItem('pendingApprovalOrder');
      if (!storedData) {
        console.error('No stored order data found');
        return;
      }

      const orderData = JSON.parse(storedData);
      const { ordersByCook, orderForm, user, totals } = orderData;

      console.log('Creating orders with approved payment:', authorizedPaymentId);

      // Create orders for each cook with the authorized payment ID
      const orderPromises = Object.entries(ordersByCook).map(async ([cookerId, items]: [string, unknown]) => {
        const typedItems = items as any[];
        const orderData = {
          customerId: user.uid,
          customerName: user.displayName || user.email || 'Cliente',
          customerEmail: user.email || '',
          cookerId,
          dishes: typedItems.map(item => ({
            dishId: item.dishId,
            dishName: item.name,
            quantity: item.quantity,
            price: item.price,
            prepTime: item.prepTime
          })),
          subtotal: typedItems.reduce((sum, item) => sum + item.totalPrice, 0),
          deliveryFee: totals.deliveryFee / Object.keys(ordersByCook).length,
          serviceFee: totals.serviceFee / Object.keys(ordersByCook).length,
          total: (typedItems.reduce((sum, item) => sum + item.totalPrice, 0) + 
                 (totals.deliveryFee / Object.keys(ordersByCook).length) + 
                 (totals.serviceFee / Object.keys(ordersByCook).length)),
          deliveryInfo: {
            address: orderForm.deliveryAddress,
            phone: orderForm.phone,
            instructions: orderForm.specialInstructions
          },
          paymentMethod: 'card' as const,
          paymentId: authorizedPaymentId
        };

        return OrderApprovalService.createOrderWithApproval(orderData);
      });

      const results = await Promise.all(orderPromises);
      const successfulOrders = results.filter(Boolean);

      if (successfulOrders.length > 0) {
        // Clear stored data
        sessionStorage.removeItem('pendingApprovalOrder');
        
        toast.success('¡Órdenes creadas!', {
          description: 'Tus órdenes han sido enviadas para aprobación del cocinero.',
          duration: 4000
        });
      }

    } catch (error) {
      console.error('Error creating orders from stored data:', error);
      toast.error('Error al crear las órdenes. Por favor, contacta soporte.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            {isHoldMode ? (
              <>
                <Shield className="h-20 w-20 text-blue-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2 text-blue-600">¡Pago Autorizado!</h1>
                <p className="text-muted-foreground">
                  Tu pago está en espera hasta la aprobación del cocinero
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2 text-green-600">¡Pago Exitoso!</h1>
                <p className="text-muted-foreground">
                  Tu pago ha sido procesado correctamente
                </p>
              </>
            )}
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Detalles del Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentData && (
                <>
                  <div className="flex justify-between items-center">
                    <span>ID de Pago:</span>
                    <span className="font-mono text-sm">{paymentData.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Estado:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {MercadoPagoService.getPaymentStatusText(paymentData.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Monto:</span>
                    <span className="font-semibold text-lg">
                      {MercadoPagoService.formatCurrency(paymentData.transaction_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Método de Pago:</span>
                    <span className="capitalize">{paymentData.payment_method_id}</span>
                  </div>
                  {paymentData.date_approved && (
                    <div className="flex justify-between items-center">
                      <span>Fecha de Aprobación:</span>
                      <span className="text-sm">
                        {new Date(paymentData.date_approved).toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              {externalReference && (
                <div className="flex justify-between items-center">
                  <span>Número de Orden:</span>
                  <span className="font-mono text-sm">{externalReference}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`mb-6 ${isHoldMode ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                {isHoldMode ? (
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                ) : (
                  <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-semibold mb-1 ${isHoldMode ? 'text-blue-800' : 'text-green-800'}`}>
                    ¿Qué sigue?
                  </h4>
                  {isHoldMode ? (
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Tu pago está autorizado y en espera</li>
                      <li>• El cocinero debe aprobar tu pedido primero</li>
                      <li>• Recibirás notificaciones cuando sea aprobado</li>
                      <li>• Una vez aprobado, se procesará el pago y comenzará la preparación</li>
                      <li>• Si es rechazado, se cancelará la autorización automáticamente</li>
                    </ul>
                  ) : (
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Tu pedido ha sido confirmado y enviado al cocinero</li>
                      <li>• Recibirás notificaciones sobre el estado de tu pedido</li>
                      <li>• El cocinero comenzará a preparar tu comida</li>
                      <li>• Un conductor recogerá y entregará tu pedido</li>
                      <li>• Tiempo estimado de entrega: 45-60 minutos</li>
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => router.push('/client/orders')}
            >
              Ver Mis Pedidos
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/dishes')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continuar Comprando
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}