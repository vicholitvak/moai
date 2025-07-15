
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { allDishes, findOrder } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { type Order, type Dish } from '@/lib/data';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [dish, setDish] = useState<Dish | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const foundOrder = findOrder(orderId);
    if (foundOrder) {
        const foundDish = allDishes.find((d) => d.id === foundOrder.dishId);
        setOrder(foundOrder);
        if (foundDish) {
            setDish(foundDish);
            const subtotal = foundDish.price * foundOrder.quantity;
            const deliveryFee = 500;
            const taxes = subtotal * 0.19;
            setTotalPrice(subtotal + deliveryFee + taxes);
        }
    }
  }, [orderId]);


  if (!order || !dish) {
    // You can add a loading skeleton here
    return (
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
            <p>Loading confirmation...</p>
        </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-headline">Thank You for Your Order!</CardTitle>
            <CardDescription>
              Your order has been placed successfully. You can track its progress below.
            </CardDescription>
            <p className="text-sm text-muted-foreground pt-2">Order ID: <span className="font-mono">{order.id}</span></p>
          </CardHeader>
          <CardContent>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Image 
                  src={dish.image}
                  alt={dish.name}
                  width={80}
                  height={80}
                  className="rounded-md object-cover"
                  data-ai-hint={dish.hint}
                />
                <div>
                  <h4 className="font-semibold">{dish.name}</h4>
                  <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                </div>
              </div>
              <p className="font-bold text-lg">{formatPrice(dish.price * order.quantity)}</p>
            </div>
             <Separator className="my-4" />
             <div className="space-y-2">
                <div className="flex justify-between font-bold text-xl">
                    <span>Total Paid</span>
                    <span>{formatPrice(totalPrice)}</span>
                </div>
             </div>
          </CardContent>
          <CardFooter className="flex-col sm:flex-row gap-4">
            <Button asChild className="w-full">
              <Link href={`/order-status/${order.id}`}>
                Track Your Order
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dishes">Continue Shopping</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
