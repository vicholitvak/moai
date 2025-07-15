
"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { allDishes, findOrder, type Order, type Dish } from "@/lib/data";
import Image from "next/image";
import { CheckCircle, Circle, Soup, Bike, Home, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const orderSteps = [
  { status: "Order Placed", icon: CheckCircle },
  { status: "Preparing Food", icon: Soup },
  { status: "Ready for Pickup", icon: PackageCheck },
  { status: "Out for Delivery", icon: Bike },
  { status: "Delivered", icon: Home },
];

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [dish, setDish] = useState<Dish | null>(null);

  // In a real app with a database, you'd use a real-time listener (like Firestore's onSnapshot)
  // to get live updates. For now, we'll use a polling mechanism to simulate this.
  useEffect(() => {
    const fetchOrderData = () => {
      const foundOrder = findOrder(orderId);
      if (foundOrder) {
        setOrder(foundOrder);
        const foundDish = allDishes.find((d) => d.id === foundOrder.dishId);
        setDish(foundDish || null);
      }
    };
    
    fetchOrderData();
    const interval = setInterval(fetchOrderData, 2000); // Check for updates every 2 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  if (!order || !dish) {
    return (
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <p>Loading order details...</p>
      </main>
    );
  }
  
  const currentStepIndex = orderSteps.findIndex(step => step.status === order.status);

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-headline mb-2">Track Your Order</h1>
        <p className="text-muted-foreground mb-6">
          Order ID: <span className="font-mono">{order.id}</span>
        </p>

        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Your Order</CardTitle>
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
                <h3 className="font-semibold">{dish.name}</h3>
                <p className="text-sm text-muted-foreground">by {dish.cook}</p>
                <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>
              We'll update you as your order progresses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {orderSteps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                const Icon = step.icon;

                return (
                  <li key={step.status} className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2",
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : "",
                        isActive
                          ? "bg-primary/20 border-primary text-primary animate-pulse"
                          : "",
                         !isCompleted && !isActive ? "bg-muted text-muted-foreground" : ""
                      )}
                    >
                      {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "font-semibold",
                          isCompleted ? "text-primary" : "",
                          isActive ? "text-primary" : ""
                        )}
                      >
                        {step.status}
                      </p>
                       <p className="text-sm text-muted-foreground">
                        {isActive && "In progress..."}
                        {isCompleted && "Completed"}
                       </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
