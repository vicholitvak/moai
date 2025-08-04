'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowLeft, Receipt, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MercadoPagoService } from '@/lib/services/mercadoPagoService';
import { formatPrice } from '@/lib/utils';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (paymentId) {
        try {
          const data = await MercadoPagoService.getPaymentStatus(paymentId);
          setPaymentData(data);
        } catch (error) {
          console.error('Error fetching payment data:', error);
        }
      }
      setLoading(false);
    };

    fetchPaymentData();
  }, [paymentId]);

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
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2 text-green-600">¡Pago Exitoso!</h1>
            <p className="text-muted-foreground">
              Tu pago ha sido procesado correctamente
            </p>
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

          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800 mb-1">¿Qué sigue?</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Tu pedido ha sido confirmado y enviado al cocinero</li>
                    <li>• Recibirás notificaciones sobre el estado de tu pedido</li>
                    <li>• El cocinero comenzará a preparar tu comida</li>
                    <li>• Un conductor recogerá y entregará tu pedido</li>
                    <li>• Tiempo estimado de entrega: 45-60 minutos</li>
                  </ul>
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