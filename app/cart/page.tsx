'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { OrdersService, CooksService } from '@/lib/firebase/dataService';
import { MercadoPagoService } from '@/lib/services/mercadoPagoService';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  CreditCard,
  User,
  CheckCircle,
  Shield
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { formatPrice, generateDeliveryCode } from '../../lib/utils';

// Remove mock data - using cart context now

const CartPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { 
    items: cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getCartSubtotal,
    getDeliveryFee,
    getServiceFee,
    getTotal
  } = useCart();
  
  const [currentStep, setCurrentStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: '',
    phone: '',
    specialInstructions: '',
    paymentMethod: 'mercadopago'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Get totals from cart context
  const subtotal = getCartSubtotal();
  const deliveryFee = getDeliveryFee();
  const serviceFee = getServiceFee();
  const total = getTotal();

  // updateQuantity and removeFromCart are now from cart context

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      // First, create the order in Firebase
      const ordersByCook = cartItems.reduce((acc, item) => {
        if (!acc[item.cookerId]) {
          acc[item.cookerId] = [];
        }
        acc[item.cookerId].push(item);
        return acc;
      }, {} as Record<string, typeof cartItems>);

      // Create a single order ID for Mercado Pago reference
      const mainOrderId = `order_${Date.now()}_${user.uid}`;
      
      // Generate delivery code for order verification
      const deliveryCode = generateDeliveryCode();
      
      // Create orders for each cook
      const orderPromises = Object.entries(ordersByCook).map(async ([cookerId, items]) => {
        // Check if cook has self-delivery enabled
        const cook = await CooksService.getCookById(cookerId);
        const isSelfDelivery = cook?.settings?.selfDelivery || false;
        const orderData = {
          customerId: user.uid,
          customerName: user.displayName || user.email || 'Customer',
          cookerId,
          dishes: items.map(item => ({
            dishId: item.dishId,
            dishName: item.name,
            quantity: item.quantity,
            price: item.price,
            prepTime: item.prepTime
          })),
          subtotal: items.reduce((sum, item) => sum + item.totalPrice, 0),
          deliveryFee: deliveryFee / Object.keys(ordersByCook).length,
          serviceFee: serviceFee / Object.keys(ordersByCook).length,
          total: (items.reduce((sum, item) => sum + item.totalPrice, 0) + 
                 (deliveryFee / Object.keys(ordersByCook).length) + 
                 (serviceFee / Object.keys(ordersByCook).length)),
          status: 'pending' as const,
          deliveryInfo: {
            address: orderForm.deliveryAddress,
            phone: orderForm.phone,
            instructions: orderForm.specialInstructions
          },
          paymentId: mainOrderId,
          deliveryCode: deliveryCode,
          isDelivered: false,
          isSelfDelivery: isSelfDelivery,
          driverId: isSelfDelivery ? cookerId : undefined // Cook is the driver for self-delivery
        };

        return OrdersService.createOrder(orderData);
      });

      await Promise.all(orderPromises);

      // Create Mercado Pago payment preference
      const paymentData = {
        amount: total,
        description: `Pedido Moai - ${cartItems.length} items`,
        orderId: mainOrderId,
        customerEmail: user.email || '',
        customerName: user.displayName || user.email || 'Cliente',
        items: cartItems.map(item => ({
          id: item.dishId,
          title: item.name,
          quantity: item.quantity,
          unit_price: MercadoPagoService.convertCurrency(item.price)
        }))
      };

      const preference = await MercadoPagoService.createPreference(paymentData);
      
      if (preference.initPoint) {
        // Clear cart before redirecting to payment
        clearCart();
        
        // Show success message
        toast.success('Redirigiendo a Mercado Pago...', {
          description: 'Tu pedido ha sido creado exitosamente',
          duration: 2000
        });
        
        // Redirect to Mercado Pago payment
        setTimeout(() => {
          window.location.href = preference.initPoint;
        }, 1000);
      } else {
        throw new Error('Failed to create payment preference');
      }
      
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Error al procesar el pago. Por favor, intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
  };

  if (currentStep === 'confirmation') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground">
                Your order has been placed successfully. You'll receive updates via email and SMS.
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Order Total</span>
                    <span className="font-semibold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Address</span>
                    <span className="text-sm text-muted-foreground max-w-48 text-right">
                      {orderForm.deliveryAddress}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone</span>
                    <span className="text-sm text-muted-foreground">{orderForm.phone}</span>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>What's next?</strong>
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Your order has been sent to the cook(s)</li>
                      <li>• You'll be notified when they accept your order</li>
                      <li>• Track your order progress in real-time</li>
                      <li>• Estimated delivery: 45-60 minutes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/dishes')}>
                Continue Shopping
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/client/home')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {currentStep === 'cart' ? 'Shopping Cart' : 'Checkout'}
                </h1>
                <p className="text-muted-foreground">
                  {currentStep === 'cart' 
                    ? `${cartItems.length} items in your cart`
                    : 'Complete your order'
                  }
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
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {currentStep === 'cart' ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                    <p className="text-muted-foreground mb-4">
                      Discover delicious dishes from local cooks
                    </p>
                    <Button onClick={() => router.push('/dishes')}>
                      Browse Dishes
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFromCart(item.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={item.cookerAvatar} />
                              <AvatarFallback className="text-xs">C</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{item.cookerName}</span>
                            <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                              <p className="text-sm text-muted-foreground">{formatPrice(item.price)} each</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Order Summary */}
            {cartItems.length > 0 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <div className="text-right">
                        {deliveryFee === 0 ? (
                          <div>
                            <span className="line-through text-muted-foreground">{formatPrice(2500)}</span>
                            <span className="ml-2 text-primary">FREE</span>
                          </div>
                        ) : (
                          <span>{formatPrice(deliveryFee)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fee (12%)</span>
                      <span>{formatPrice(serviceFee)}</span>
                    </div>
                    {subtotal < 25000 && deliveryFee > 0 && (
                      <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        💡 Add {formatPrice(25000 - subtotal)} more for free delivery!
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setCurrentStep('checkout')}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Checkout Form */
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
                <CardDescription>Where should we deliver your order?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full delivery address..."
                    value={orderForm.deliveryAddress}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('deliveryAddress', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={orderForm.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Any special delivery instructions..."
                    value={orderForm.specialInstructions}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('specialInstructions', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Información de Pago
                </CardTitle>
                <CardDescription>Elige tu método de pago preferido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Método de Pago</Label>
                  <div className="space-y-3">
                    {/* MercadoPago Option */}
                    <label 
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/5 ${
                        orderForm.paymentMethod === 'mercadopago' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mercadopago"
                        checked={orderForm.paymentMethod === 'mercadopago'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-semibold">
                          MercadoPago
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Pago Online Seguro</div>
                          <div className="text-sm text-muted-foreground">Tarjetas, transferencias y más</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                          orderForm.paymentMethod === 'mercadopago' 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground/30'
                        }`}>
                          {orderForm.paymentMethod === 'mercadopago' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                      </div>
                    </label>

                    {/* Cash on Delivery Option (temporarily disabled) */}
                    <label 
                      className="flex items-center p-4 border-2 rounded-lg cursor-not-allowed transition-all duration-200 bg-muted border-border opacity-60"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        disabled
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-muted-foreground text-muted px-3 py-1 rounded text-sm font-semibold">
                          💰 Efectivo
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-muted-foreground">Pago contra entrega</div>
                          <div className="text-sm text-muted-foreground/70">Proximamente disponible</div>
                        </div>
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30"></div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* MercadoPago Details */}
                {orderForm.paymentMethod === 'mercadopago' && (
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-foreground/80 mb-4">
                      Serás redirigido a Mercado Pago para completar tu pago de forma segura.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>Encriptación SSL</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CreditCard className="h-3 w-3" />
                        <span>Todas las tarjetas</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-foreground">Métodos disponibles:</h4>
                      
                      {/* Payment methods grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background p-3 rounded border border-border">
                          <div className="text-xs font-medium text-foreground mb-1">💳 Tarjetas</div>
                          <div className="text-xs text-muted-foreground">Visa, Mastercard, AmEx</div>
                        </div>
                        <div className="bg-background p-3 rounded border border-border">
                          <div className="text-xs font-medium text-foreground mb-1">🏧 Débito</div>
                          <div className="text-xs text-muted-foreground">Redbank, Santander</div>
                        </div>
                        <div className="bg-background p-3 rounded border border-border">
                          <div className="text-xs font-medium text-foreground mb-1">🏦 Transferencia</div>
                          <div className="text-xs text-muted-foreground">Banco a banco</div>
                        </div>
                        <div className="bg-background p-3 rounded border border-border">
                          <div className="text-xs font-medium text-foreground mb-1">💰 Efectivo</div>
                          <div className="text-xs text-muted-foreground">Servipag, Sencillito</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">100% Seguro</span>
                  </div>
                  <p className="text-sm text-foreground/80">
                    Mercado Pago protege tus datos y transacciones. No almacenamos información de tarjetas.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                      </div>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fee</span>
                      <span>{formatPrice(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 hover:scale-105 transition-transform duration-150"
                onClick={() => setCurrentStep('cart')}
                disabled={isProcessing}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Button>
              <Button 
                className={`flex-1 relative overflow-hidden transition-all duration-300 ${
                  isProcessing ? 'bg-primary hover:bg-primary/90' : 'hover:scale-105'
                }`}
                onClick={handleCheckout}
                disabled={isProcessing || !orderForm.deliveryAddress || !orderForm.phone}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando Pago...
                    <div className="absolute inset-0 bg-white/10 animate-pulse rounded-lg" />
                  </>
                ) : (
                  <>
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold mr-2">
                      MP
                    </div>
                    Pagar {formatPrice(total)}
                  </>
                )}
              </Button>
            </div>

            {/* Form validation hints */}
            {(!orderForm.deliveryAddress || !orderForm.phone) && (
              <div className="bg-muted border border-border p-3 rounded-lg animate-in fade-in-50 duration-300">
                <p className="text-sm text-foreground">
                  <strong>Completa los datos requeridos:</strong>
                </p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  {!orderForm.deliveryAddress && <li>• Dirección de entrega</li>}
                  {!orderForm.phone && <li>• Número de teléfono</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
