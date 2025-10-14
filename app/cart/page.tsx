'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUserProfile } from '../../context/UserProfileContext';
import type { Order } from '@/lib/firebase/dataService';
import { MercadoPagoService } from '@/lib/services/mercadoPagoService';
import { OrderApprovalService } from '@/lib/services/orderApprovalService';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  CreditCard,
  Banknote,
  User,
  CheckCircle,
  Shield,
  Save
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import GoogleAddressAutocomplete from '../../components/GoogleAddressAutocomplete';
import { formatPrice } from '../../lib/utils';

// Remove mock data - using cart context now

const CartPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, updateProfile } = useUserProfile();
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
    deliveryAddress: profile?.address?.fullAddress ?? '',
    deliveryCoordinates: profile?.address?.coordinates ?? null,
    phone: profile?.phone ?? '',
    specialInstructions: '',
    paymentMethod: 'mercadopago' as 'mercadopago' | 'cash'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressToSave, setAddressToSave] = useState<{
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      placeId?: string;
      formattedAddress?: string;
      source?: 'autocomplete' | 'geocoded' | 'manual';
    } | null;
    fullAddressData?: google.maps.places.PlaceResult;
  } | null>(null);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setOrderForm(prev => ({
        ...prev,
        deliveryAddress: profile.address?.fullAddress ?? prev.deliveryAddress,
        phone: profile.phone ?? prev.phone
      }));
    }
  }, [profile]);

  // Get totals from cart context
  const subtotal = getCartSubtotal();
  const deliveryFee = getDeliveryFee();
  const serviceFee = getServiceFee();
  const total = getTotal();

  // Handle digital payment orders with approval (requires MercadoPago hold)
  const handleDigitalOrderWithApproval = async () => {
    if (!user || cartItems.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      // For digital payments with approval, we need to create MercadoPago preference with hold first
      // Then create orders in pending_approval status after payment authorization
      
      const mainOrderId = `hold_${Date.now()}_${user.uid}`;
      
      // Create MercadoPago payment preference with authorization hold
      const paymentData = {
        amount: total,
        description: `Pedido Moai con Aprobación - ${cartItems.length} items`,
        orderId: mainOrderId,
        customerEmail: user.email ?? '',
        customerName: user.displayName ?? user.email ?? 'Cliente',
        items: cartItems.map(item => ({
          id: item.dishId,
          title: item.name,
          quantity: item.quantity,
          unit_price: MercadoPagoService.convertCurrency(item.price)
        }))
      };

      const preference = await MercadoPagoService.createPreferenceWithHold(paymentData);
      
      if (preference.initPoint) {
        // Store order data in sessionStorage for processing after payment authorization
        const ordersByCook = cartItems.reduce((acc, item) => {
          if (!acc[item.cookerId]) {
            acc[item.cookerId] = [];
          }
          acc[item.cookerId]?.push(item);
          return acc;
        }, {} as Record<string, typeof cartItems>);

        const pendingOrderData = {
          ordersByCook,
          mainOrderId,
          orderForm,
          user: { uid: user.uid, displayName: user.displayName, email: user.email },
          totals: { subtotal, deliveryFee, serviceFee, total }
        };
        
        sessionStorage.setItem('pendingApprovalOrder', JSON.stringify(pendingOrderData));
        
        // Clear cart before redirecting to payment
        clearCart();
        
        // Show success message
        toast.success('Redirigiendo a Mercado Pago...', {
          description: 'Tu pago se mantendrá en espera hasta la aprobación del cocinero',
          duration: 2000
        });
        
        // Redirect to MercadoPago payment with hold
        setTimeout(() => {
          window.location.href = preference.initPoint;
        }, 1000);
      } else {
        throw new Error('Failed to create payment preference with hold');
      }
      
    } catch (error) {
      console.error('Error creating digital order with approval:', error);
      toast.error('Error al crear la orden. Por favor, intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cash payment orders with approval
  const handleCashOrderWithApproval = async () => {
    if (!user || cartItems.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      // Create cash orders with approval for each cook
      const ordersByCook = cartItems.reduce((acc, item) => {
        if (!acc[item.cookerId]) {
          acc[item.cookerId] = [];
        }
        acc[item.cookerId]?.push(item);
        return acc;
      }, {} as Record<string, typeof cartItems>);

      const orderPromises = Object.entries(ordersByCook).map(async ([cookerId, items]) => {
          const orderData = {
          customerId: user.uid,
          customerName: user.displayName ?? user.email ?? 'Cliente',
          customerEmail: user.email ?? '',
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
          deliveryInfo: {
            address: orderForm.deliveryAddress,
            phone: orderForm.phone,
            instructions: orderForm.specialInstructions,
            coordinates: orderForm.deliveryCoordinates
          },
          paymentMethod: 'cash_on_delivery' as const
        };

        return OrderApprovalService.createOrderWithApproval(orderData);
      });

      const results = await Promise.all(orderPromises);
      const successfulOrders = results.filter(Boolean);

      if (successfulOrders.length > 0) {
        // Clear cart
        clearCart();
        
        // Show success message
        toast.success('¡Orden enviada para aprobación!', {
          description: 'El cocinero debe aprobar tu orden en efectivo antes de procesar. Recibirás notificaciones cuando sea aprobada.',
          duration: 4000
        });
        
        // Redirect to orders page
        setTimeout(() => {
          router.push('/client/orders');
        }, 2000);
      } else {
        throw new Error('No se pudo crear ninguna orden');
      }
      
    } catch (error) {
      console.error('Error creating cash order with approval:', error);
      toast.error('Error al crear la orden. Por favor, intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // updateQuantity and removeFromCart are now from cart context

  const validateCheckout = () => {
    if (!orderForm.deliveryAddress || orderForm.deliveryAddress.length < 10) {
      toast.error('Ingresa una dirección de entrega válida');
      return false;
    }

    if (!orderForm.deliveryCoordinates) {
      toast.error('Selecciona una dirección de la lista o valida manualmente para asegurar la ubicación exacta.');
      return false;
    }

    if (!orderForm.phone || orderForm.phone.length < 8) {
      toast.error('Ingresa un teléfono de contacto válido');
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) return;
    // Validaciones de dirección y contacto
    if (!validateCheckout()) return;

    if (orderForm.paymentMethod === 'cash') {
      return handleCashOrderWithApproval();
    }

    return handleDigitalOrderWithApproval();
  };

  const handleInputChange = (field: string, value: string) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle address change with optional profile saving
  const handleAddressChange = async (
    address: string,
    coordinates?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      placeId?: string;
      formattedAddress?: string;
      source?: 'autocomplete' | 'geocoded' | 'manual';
    },
    fullAddressData?: google.maps.places.PlaceResult
  ) => {
    setOrderForm(prev => ({
      ...prev,
      deliveryAddress: address,
      deliveryCoordinates: coordinates ?? null
    }));

    if (user && profile && address && address !== profile.address?.fullAddress && coordinates) {
    setAddressToSave({ address, coordinates, fullAddressData });
    } else {
      setAddressToSave(null);
    }
  };

  // Save new address to user profile
  const saveAddressToProfile = async () => {
    if (!user || !profile || !addressToSave) return;

    try {
      // Parse address components for saving
      let addressUpdate = {
        fullAddress: addressToSave.address,
        street: addressToSave.address, // Fallback to full address
        city: profile.address?.city ?? 'Santiago',
        district: profile.address?.district ?? '',
        details: profile.address?.details ?? '',
        instructions: profile.address?.instructions ?? '',
        coordinates: addressToSave.coordinates ?? profile.address?.coordinates ?? undefined
      };

      // If we have detailed address data from Google Places, use it
      if (addressToSave.fullAddressData?.address_components) {
        const components = addressToSave.fullAddressData.address_components;
        
        // Extract street number and route
        const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name ?? '';
        const route = components.find(c => c.types.includes('route'))?.long_name ?? '';
        const street = `${route} ${streetNumber}`.trim() || addressToSave.address;
        
        // Extract locality/city and sublocality (district/comuna)
        const city = components.find(c => 
          c.types.includes('locality') || c.types.includes('administrative_area_level_2')
        )?.long_name ?? 'Santiago';
        
        const district = components.find(c => 
          c.types.includes('sublocality') || c.types.includes('administrative_area_level_3')
        )?.long_name ?? profile.address?.district ?? '';

        addressUpdate = {
          ...addressUpdate,
          street,
          city,
          district,
          coordinates: addressToSave.coordinates ?? addressUpdate.coordinates
        };
      }

      const success = await updateProfile({ address: addressUpdate });
      
      if (success) {
        toast.success('Dirección guardada en tu perfil');
        setAddressToSave(null);
      } else {
        toast.error('Error al guardar la dirección');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Error al guardar la dirección');
    }
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
                Your order has been placed successfully. You&apos;ll receive updates via email and SMS.
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
                      <strong>What&apos;s next?</strong>
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Your order has been sent to the cook(s)</li>
                      <li>• You&apos;ll be notified when they accept your order</li>
                      <li>• Track your order progress in real-time</li>
                      <li>• Estimated delivery: 45-60 minutes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button className="w-full bg-atacama-orange hover:bg-atacama-orange/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" onClick={() => router.push('/dishes')}>
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
                  className="w-full bg-atacama-orange hover:bg-atacama-orange/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
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
                  <GoogleAddressAutocomplete
                    value={orderForm.deliveryAddress}
                    onChange={handleAddressChange}
                    placeholder="Ingresa tu dirección de entrega..."
                    userSavedAddress={profile?.address?.fullAddress}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    La dirección será detectada automáticamente para una entrega más precisa
                  </p>
                  {/* Save address button */}
                  {addressToSave && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">Nueva dirección detectada</p>
                          <p className="text-xs text-blue-700">
                            ¿Quieres guardar esta dirección en tu perfil para futuros pedidos?
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={saveAddressToProfile}
                          className="bg-atacama-orange hover:bg-atacama-orange/90 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>
                      </div>
                    </div>
                  )}
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
                          <div className="text-sm text-blue-600">⚡ Requiere aprobación del cocinero</div>
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

                    {/* Cash on Delivery Option */}
                    <label 
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 ${
                        orderForm.paymentMethod === 'cash' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-border hover:border-orange-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={orderForm.paymentMethod === 'cash'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-1">
                          <Banknote className="h-4 w-4" />
                          Efectivo
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Pago contra entrega</div>
                          <div className="text-sm text-orange-600">
                            ⚡ Requiere aprobación del cocinero
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                          orderForm.paymentMethod === 'cash' 
                            ? 'border-orange-500 bg-orange-500' 
                            : 'border-muted-foreground/30'
                        }`}>
                          {orderForm.paymentMethod === 'cash' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* MercadoPago Details */}
                {orderForm.paymentMethod === 'mercadopago' && (
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-foreground/80 mb-4">
                      El cocinero debe aprobar tu orden antes de procesar el pago digital.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500 text-white p-2 rounded-full">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Proceso de Aprobación Digital</h4>
                          <p className="text-sm text-blue-700 mb-2">
                            Tu pago se mantendrá en espera hasta que el cocinero confirme la disponibilidad.
                          </p>
                          <div className="text-xs text-blue-600 space-y-1">
                            <div>• ✅ Confirmación de disponibilidad garantizada</div>
                            <div>• ⏰ Tiempo estimado real de preparación</div>
                            <div>• 🔔 Notificaciones de estado en tiempo real</div>
                            <div>• 💳 Pago seguro solo después de aprobación</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
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

                {/* Cash Payment Details */}
                {orderForm.paymentMethod === 'cash' && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="bg-orange-500 text-white p-2 rounded-full">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-900 mb-1">Pago en Efectivo contra Entrega</h4>
                        <p className="text-sm text-orange-700">
                          El cocinero debe aprobar tu pedido antes de comenzar la preparación.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border border-orange-200">
                        <div className="text-sm font-medium text-orange-900 mb-2">📋 Cómo funciona:</div>
                        <ol className="text-xs text-orange-700 space-y-1 list-decimal list-inside">
                          <li>Enviamos tu pedido al cocinero</li>
                          <li>El cocinero revisa y aprueba tu orden</li>
                          <li>Una vez aprobado, comienza la preparación</li>
                          <li>Pagas en efectivo al momento de la entrega</li>
                        </ol>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Sin comisiones adicionales por pago en efectivo</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <Shield className="h-3 w-3" />
                        <span>Pago seguro en tu domicilio</span>
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
                className={`flex-1 relative overflow-hidden transition-all duration-300 bg-atacama-orange hover:bg-atacama-orange/90 text-white font-semibold shadow-md hover:shadow-lg ${
                  isProcessing ? 'bg-atacama-orange hover:bg-atacama-orange/90' : 'hover:scale-105'
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
                    {orderForm.paymentMethod === 'cash' ? (
                      <>
                        <Banknote className="h-5 w-5 mr-2" />
                        Confirmar Pedido - {formatPrice(total)}
                      </>
                    ) : (
                      <>
                        <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold mr-2">
                          MP
                        </div>
                        Confirmar Pedido - {formatPrice(total)}
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>

            {/* Approval Notice */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg animate-in fade-in-50 duration-300">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white p-2 rounded-full">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Tu orden está sujeta a aprobación</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    El cocinero revisará tu pedido y confirmará la disponibilidad antes de procesar.
                  </p>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>• ✅ Disponibilidad garantizada</div>
                    <div>• ⏰ Tiempo de preparación preciso</div>
                    <div>• 🔔 Notificaciones en tiempo real</div>
                    {orderForm.paymentMethod === 'mercadopago' ? (
                      <div>• 💳 Pago seguro después de la aprobación</div>
                    ) : (
                      <div>• 💰 Pago contra entrega</div>
                    )}
                  </div>
                </div>
              </div>
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
