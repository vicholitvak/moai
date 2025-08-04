'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function PaymentPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Clock className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2 text-yellow-600">Pago Pendiente</h1>
            <p className="text-muted-foreground">
              Tu pago está siendo procesado
            </p>
          </div>

          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Estado del Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700 mb-4">
                Tu pago está siendo verificado. Esto puede tomar unos minutos.
              </p>
              
              {paymentId && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ID de Pago:</span>
                    <span className="font-mono">{paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado:</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                  </div>
                  {externalReference && (
                    <div className="flex justify-between">
                      <span>Número de Orden:</span>
                      <span className="font-mono">{externalReference}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>¿Qué significa esto?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Tu pago está siendo verificado por el sistema bancario</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Recibirás una notificación cuando el pago sea confirmado</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Tu pedido será procesado una vez confirmado el pago</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Puedes consultar el estado en "Mis Pedidos"</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Tiempo estimado</h4>
                  <p className="text-sm text-blue-700">
                    La verificación usualmente toma entre 5-10 minutos. 
                    En casos excepcionales puede tomar hasta 24 horas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => router.push('/client/orders')}
            >
              Ver Estado del Pedido
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Estado
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

export default function PaymentPending() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
}