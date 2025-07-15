
"use client";

import { useState } from "react";
import { allOrders, allDishes, type Order, type OrderStatus, type Dish } from "@/lib/data";
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
import { ChevronRight, Truck, MapPin, ChefHat, Package, CheckCheck, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function FindDeliveriesPage() {
  const [orders, setOrders] = useState(allOrders);
  const [verificationCode, setVerificationCode] = useState<Record<string, string>>({});
  const { toast } = useToast();


  const getDishForOrder = (order: Order): Dish | undefined => {
    return allDishes.find(dish => dish.id === order.dishId);
  }
  
  const getCookForDish = (dish: Dish): {name: string, location: string} => {
    // In a real app, this would look up the cook's profile
    return { name: dish.cook, location: '123 Cook St, Santiago' };
  }

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
     // Find the original order in the central 'database' and update it
    const centralOrder = allOrders.find(o => o.id === orderId);
    if(centralOrder) centralOrder.status = newStatus;
    // Refresh local state
    setOrders([...allOrders]);
  };

  const handleCompleteDelivery = (order: Order) => {
    const enteredCode = verificationCode[order.id] || '';
    if (enteredCode === order.verificationCode) {
      handleStatusUpdate(order.id, "Delivered");
      toast({
        title: "Delivery Complete!",
        description: `Order #${order.id.substring(0,6)} has been successfully delivered.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect Code",
        description: "The verification code is incorrect. Please try again.",
      });
    }
  }
  
  const getCustomerAddress = (order: Order): string => {
    // In a real app, this would come from the order details
    return `456 Customer Ave, Santiago`;
  }

  const renderOrderCard = (order: Order, isAvailable: boolean) => {
    const dish = getDishForOrder(order);
    if (!dish) return null;
    
    const cook = getCookForDish(dish);
    const customerAddress = getCustomerAddress(order);

    return (
      <Card key={order.id} className="shadow-lg">
        <CardHeader>
           <div className="flex justify-between items-start">
              <div>
                <CardTitle>Delivery Job #{order.id.substring(0, 6)}</CardTitle>
                <CardDescription>
                  <span className="font-semibold">{dish.name}</span> by {dish.cook}
                </CardDescription>
              </div>
              <Badge variant={order.status === 'Ready for Pickup' ? 'secondary' : 'default'} className="capitalize">
                {order.status}
              </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <ChefHat className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">Pickup From: {cook.name}</p>
              <p className="text-sm text-muted-foreground">{cook.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">Deliver To: {order.customerName}</p>
              <p className="text-sm text-muted-foreground">{customerAddress}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end items-center gap-2">
            {isAvailable ? (
              <Button onClick={() => handleStatusUpdate(order.id, "Out for Delivery")}>
                Accept Delivery
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex w-full items-center gap-2">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="4-digit code" 
                  maxLength={4}
                  className="w-32"
                  value={verificationCode[order.id] || ''}
                  onChange={(e) => setVerificationCode(prev => ({...prev, [order.id]: e.target.value}))}
                />
                <Button onClick={() => handleCompleteDelivery(order)} variant="secondary">
                  Complete Delivery
                  <CheckCheck className="h-4 w-4 ml-2" />
                </Button>
               </div>
            )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-headline">Driver's Hub</h1>
          <p className="text-muted-foreground">Find and manage your deliveries.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-headline mb-4 flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Available Deliveries
            </h2>
            <div className="space-y-6">
              {orders.filter(o => o.status === "Ready for Pickup").length > 0 ? (
                orders.filter(o => o.status === "Ready for Pickup").map(order => renderOrderCard(order, true))
              ) : (
                <Card className="text-center p-8">
                  <CardContent>
                    <p className="text-muted-foreground">No deliveries are ready for pickup right now.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-headline mb-4 flex items-center gap-2">
               <Truck className="h-6 w-6 text-primary" />
              My Active Deliveries
            </h2>
            <div className="space-y-6">
               {orders.filter(o => o.status === "Out for Delivery").length > 0 ? (
                orders.filter(o => o.status === "Out for Delivery").map(order => renderOrderCard(order, false))
              ) : (
                <Card className="text-center p-8">
                  <CardContent>
                    <p className="text-muted-foreground">You have no active deliveries.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
