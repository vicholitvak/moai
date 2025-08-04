'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function PaymentFailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const statusDetail = searchParams.get('status_detail');

  const getFailureMessage = (statusDetail: string | null) => {
    switch (statusDetail) {
      case 'cc_rejected_insufficient_amount':
        return 'La tarjeta no tiene fondos suficientes';
      case 'cc_rejected_bad_filled_security_code':
        return 'Código de seguridad incorrecto';
      case 'cc_rejected_bad_filled_date':
        return 'Fecha de vencimiento incorrecta';
      case 'cc_rejected_bad_filled_other':
        return 'Revisa los datos de la tarjeta';
      case 'cc_rejected_high_risk':
        return 'Pago rechazado por seguridad';
      case 'cc_rejected_max_attempts':
        return 'Has alcanzado el límite de intentos';
      case 'cc_rejected_duplicated_payment':
        return 'Ya existe un pago con estos datos';
      case 'cc_rejected_card_disabled':
        return 'La tarjeta está deshabilitada';
      case 'cc_rejected_call_for_authorize':
        return 'Debes autorizar el pago con tu banco';
      default:
        return 'El pago no pudo ser procesado. Por favor, intenta nuevamente.';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2 text-red-600">Pago Rechazado</h1>
            <p className="text-muted-foreground">
              No pudimos procesar tu pago
            </p>
          </div>

          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">¿Qué pasó?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                {getFailureMessage(statusDetail)}
              </p>
              
              {paymentId && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ID de Pago:</span>
                    <span className="font-mono">{paymentId}</span>
                  </div>
                  {status && (
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <Badge variant="destructive">{status}</Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sugerencias para resolver el problema</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Verifica que los datos de tu tarjeta sean correctos</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Asegúrate de tener fondos suficientes en tu cuenta</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Prueba con otro método de pago</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Contacta con tu banco si el problema persiste</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => router.push('/cart')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar Nuevamente
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/cart')}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Cambiar Método de Pago
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/dishes')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Comprar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailure() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
}