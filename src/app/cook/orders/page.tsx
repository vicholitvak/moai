
"use client";

import { useState } from "react";
import { allOrders, allDishes, type Order, type OrderStatus } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  PackageCheck,
} from "lucide-react";

// In a real app, this would be filtered by the logged-in cook's ID
const cookId = "Chef Isabella";
const cookOrders = allOrders.filter(order => {
    const dish = allDishes.find(d => d.id === order.dishId);
    return dish?.cook === cookId;
});

const statusProgression: Record<OrderStatus, OrderStatus | null> = {
  "Order Placed": "Preparing Food",
  "Preparing Food": "Ready for Pickup",
  "Ready for Pickup": null, // Driver takes over from here
  "Out for Delivery": null,
  "Delivered": null,
};


export default function CookOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(cookOrders);

  const handleUpdateStatus = (orderId: string) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        const nextStatus = statusProgression[order.status];
        if (nextStatus) {
            // Find the original order in the central 'database' and update it
            const centralOrder = allOrders.find(o => o.id === orderId);
            if(centralOrder) centralOrder.status = nextStatus;
            // Return the updated order for the local state
            return { ...order, status: nextStatus };
        }
      }
      return order;
    });
    setOrders(updatedOrders);
  };
  
  const getDishForOrder = (order: Order) => {
    return allDishes.find(dish => dish.id === order.dishId);
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-headline">Active Orders</h1>
          <p className="text-muted-foreground">Manage incoming orders and update their status.</p>
        </div>

        <div className="space-y-6">
          {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Out for Delivery' && o.status !== 'Ready for Pickup').length === 0 && (
            <Card className="text-center p-8">
                <CardContent>
                    <PackageCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">All Caught Up!</h3>
                    <p className="text-muted-foreground">You have no active orders right now.</p>
                </CardContent>
            </Card>
          )}
          {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Out for Delivery' && o.status !== 'Ready for Pickup').map(order => {
            const dish = getDishForOrder(order);
            const nextStatus = statusProgression[order.status];

            if (!dish) return null;

            return (
              <Card key={order.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Order #{order.id.substring(0, 6)}</CardTitle>
                      <CardDescription>For {order.customerName}</CardDescription>
                    </div>
                    <Badge variant={order.status === 'Order Placed' ? 'destructive' : 'default'} className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
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
                            <p className="text-muted-foreground">Quantity: {order.quantity}</p>
                        </div>
                   </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  {nextStatus ? (
                     <Button onClick={() => handleUpdateStatus(order.id)}>
                        <span>Mark as "{nextStatus}"</span>
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Waiting for driver...</p>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

      </div>
    </main>
  );
}
