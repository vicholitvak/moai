
"use client";

import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { allDishes, allOrders } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const checkoutFormSchema = z.object({
  address: z.string().min(1, { message: "Delivery address is required." }),
  creditCard: z.string().min(1, { message: "Credit card information is required." }),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const dish = allDishes.find((d) => d.id === params.id);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      address: "",
      creditCard: "",
    },
  });

  if (!dish) {
    notFound();
  }

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  }

  const onSubmit = (data: CheckoutFormValues) => {
    // In a real app, this would create an order in the database
    const orderId = Math.random().toString(36).substr(2, 9);
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Add the new order to our mock database
    allOrders.push({
      id: orderId,
      dishId: dish.id,
      quantity,
      status: 'Order Placed',
      customerName: 'Alex Johnson', // Placeholder
      verificationCode,
    });
    
    // Redirect to the order confirmation page
    router.push(`/order-confirmation/${orderId}`);
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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <CardHeader>
                            <CardTitle>Delivery & Payment</CardTitle>
                            <CardDescription>Enter your details to complete the order.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Delivery Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Sunny Lane, Apt 4B, Flavor Town" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="creditCard"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Credit Card</FormLabel>
                                        <FormControl>
                                            <Input placeholder="•••• •••• •••• 4242" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <Button type="submit" size="lg" className="w-full">Place Order</Button>
                        </CardContent>
                    </form>
                </Form>
             </Card>
          </div>

        </div>
      </div>
    </main>
  );
}
