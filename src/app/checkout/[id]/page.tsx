
"use client";

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { allDishes } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const dish = allDishes.find((d) => d.id === params.id);
  const [quantity, setQuantity] = useState(1);

  if (!dish) {
    notFound();
  }

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  }

  const subtotal = dish.price * quantity;
  const deliveryFee = 500;
  const taxes = subtotal * 0.19;
  const total = subtotal + deliveryFee + taxes;

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-headline mb-6">Checkout</h1>
        <div className="grid md:grid-cols-2 gap-12">
          
          <div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Image 
                    src={dish.image}
                    alt={dish.name}
                    width={100}
                    height={100}
                    className="rounded-md object-cover"
                    data-ai-hint={dish.hint}
                  />
                  <div>
                    <h3 className="font-semibold">{dish.name}</h3>
                    <p className="text-sm text-muted-foreground">by {dish.cook}</p>
                    <p className="text-lg font-bold text-primary mt-1">{formatPrice(dish.price)}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <Label>Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="number" 
                      className="w-16 text-center" 
                      value={quantity}
                      readOnly
                    />
                    <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes (IVA 19%)</span>
                    <span>{formatPrice(taxes)}</span>
                  </div>
                   <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>


              </CardContent>
            </Card>
          </div>

          <div>
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Delivery & Payment</CardTitle>
                    <CardDescription>Enter your details to complete the order.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address</Label>
                        <Input id="address" placeholder="123 Sunny Lane, Apt 4B, Flavor Town" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="card">Credit Card</Label>
                        <Input id="card" placeholder="•••• •••• •••• 4242" />
                    </div>
                    <Button size="lg" className="w-full">Place Order</Button>
                </CardContent>
             </Card>
          </div>

        </div>
      </div>
    </main>
  );
}
