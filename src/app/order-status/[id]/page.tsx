
"use client";

import { useState, useEffect } from "react";
import { notFound, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { allDishes, type Dish } from "@/lib/data";
import Image from "next/image";
import { CheckCircle, Circle, Soup, Bike, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const orderSteps = [
  { status: "Order Placed", icon: CheckCircle },
  { status: "Preparing Food", icon: Soup },
  { status: "Out for Delivery", icon: Bike },
  { status: "Delivered", icon: Home },
];

export default function OrderStatusPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const dishId = searchParams.get("dishId");
  const [dish, setDish] = useState<Dish | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const foundDish = allDishes.find((d) => d.id === dishId);
    if (foundDish) {
      setDish(foundDish);
    }
  }, [dishId]);

  useEffect(() => {
    if (currentStep < orderSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prevStep) => prevStep + 1);
      }, 3000); // Advance to the next step every 3 seconds

      return () => clearTimeout(timer);
    }
  }, [currentStep]);
  
  if (!dish && dishId) {
      // Still loading the dish from the client
      return (
         <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
            <p>Loading order details...</p>
        </main>
      );
  }

  if (!dish) {
    notFound();
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-headline mb-2">Track Your Order</h1>
        <p className="text-muted-foreground mb-6">
          Order ID: <span className="font-mono">{params.id}</span>
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
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
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

