'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { OrdersService, Order } from '@/lib/firebase/dataService';
import { formatPrice, formatDeliveryCode } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Search,
  MapPin,
  Phone,
  User,
  Clock,
  Utensils
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';

const DeliveryVerificationPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [deliveryCode, setDeliveryCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [verificationResult, setVerificationResult] = useState<{success: boolean; message: string} | null>(null);

  const searchOrderByCode = async () => {
    if (!deliveryCode || deliveryCode.length !== 4) {
      toast.error('Por favor ingresa un código de 4 dígitos');
      return;
    }

    setIsSearching(true);
    setFoundOrder(null);
    setVerificationResult(null);

    try {
      const order = await OrdersService.getOrderByDeliveryCode(deliveryCode);
      
      if (order) {
        setFoundOrder(order);
        toast.success('Pedido encontrado');
      } else {
        toast.error('No se encontró ningún pedido con este código o ya fue entregado');
      }
    } catch (error) {
      console.error('Error searching order:', error);
      toast.error('Error al buscar el pedido');
    } finally {
      setIsSearching(false);
    }
  };

  const verifyAndCompleteDelivery = async () => {
    if (!foundOrder || !deliveryCode) return;

    setIsVerifying(true);

    try {
      const result = await OrdersService.verifyDeliveryCode(foundOrder.id, deliveryCode);
      setVerificationResult(result);
      
      if (result.success) {
        toast.success(result.message);
        // Clear form after successful delivery
        setTimeout(() => {
          setDeliveryCode('');
          setFoundOrder(null);
          setVerificationResult(null);
        }, 3000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error verifying delivery:', error);
      toast.error('Error al verificar la entrega');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 4 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 4);
    setDeliveryCode(cleanValue);
    
    // Clear previous results when code changes
    if (foundOrder) {
      setFoundOrder(null);
      setVerificationResult(null);
    }
  };

  const formatCodeForDisplay = (code: string) => {
    if (code.length <= 2) return code;
    return `${code.slice(0, 2)}-${code.slice(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Verificación de Entrega</h1>
                <p className="text-muted-foreground">
                  Ingresa el código proporcionado por el cliente
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <User className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Code Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Código de Entrega
            </CardTitle>
            <CardDescription>
              Solicita al cliente el código de 4 dígitos para confirmar la entrega
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deliveryCode">Código de Entrega</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="deliveryCode"
                  placeholder="0000"
                  value={formatCodeForDisplay(deliveryCode)}
                  onChange={(e) => handleCodeChange(e.target.value.replace('-', ''))}
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={5} // Accounting for the dash
                />
                <Button 
                  onClick={searchOrderByCode}
                  disabled={isSearching || deliveryCode.length !== 4}
                  className="px-6"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                El código debe tener exactamente 4 dígitos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Details Section */}
        {foundOrder && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pedido #{foundOrder.id.slice(-8)}</CardTitle>
                  <CardDescription>
                    Cliente: {foundOrder.customerName}
                  </CardDescription>
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  En Entrega
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Platos
                </h4>
                <div className="space-y-2 bg-muted p-3 rounded-lg">
                  {foundOrder.dishes.map((dish, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{dish.dishName} x {dish.quantity}</span>
                      <span className="font-medium">{formatPrice(dish.price * dish.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Info */}
              <div className="space-y-3">
                <h4 className="font-medium">Información de Entrega</h4>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="text-sm font-medium">Dirección:</span>
                    <p className="text-sm text-muted-foreground">
                      {foundOrder.deliveryInfo.address}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Teléfono:</span>
                  <span className="text-sm text-muted-foreground">
                    {foundOrder.deliveryInfo.phone}
                  </span>
                </div>

                {foundOrder.deliveryInfo.instructions && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <span className="text-sm font-medium">Instrucciones:</span>
                      <p className="text-sm text-muted-foreground">
                        {foundOrder.deliveryInfo.instructions}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total del Pedido:</span>
                <span>{formatPrice(foundOrder.total)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <Card className={`mb-6 border-2 ${verificationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                {verificationResult.success ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <h3 className={`font-semibold text-lg ${verificationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {verificationResult.success ? '¡Entrega Confirmada!' : 'Error en la Verificación'}
                  </h3>
                  <p className={`text-sm ${verificationResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {verificationResult.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Button */}
        {foundOrder && !verificationResult && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">¿Confirmar Entrega?</h4>
                  <p className="text-sm text-yellow-700">
                    Asegúrate de que el cliente ha recibido su pedido antes de confirmar la entrega.
                    Esta acción no se puede deshacer.
                  </p>
                </div>
                
                <Button 
                  onClick={verifyAndCompleteDelivery}
                  disabled={isVerifying}
                  size="lg"
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirmar Entrega
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!foundOrder && !verificationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span>Solicita al cliente el código de entrega de 4 dígitos</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span>Ingresa el código en el campo de arriba y presiona &quot;Buscar&quot;</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span>Verifica que los datos del pedido coincidan</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <span>Confirma la entrega para completar el pedido</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DeliveryVerificationPage;