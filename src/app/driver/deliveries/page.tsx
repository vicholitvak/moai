
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { ChevronRight, Truck, MapPin, ChefHat, Package, CheckCheck, KeyRound, Wallet, Loader, Map } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { estimateTravelDistance } from "@/ai/flows/estimate-travel-distance-flow";

const DRIVER_CUT = 0.10; // 10% of the dish price

const statusProgression: Record<OrderStatus, OrderStatus | null> = {
  "Order Placed": null,
  "Preparing Food": null, 
  "Ready for Pickup": "Out for Delivery", // Driver action: Pick up food
  "Out for Delivery": "Delivered", // Driver action: Complete delivery
  "Delivered": null,
};


export default function FindDeliveriesPage() {
  const [orders, setOrders] = useState(allOrders);
  const [verificationCode, setVerificationCode] = useState<Record<string, string>>({});
  const [distances, setDistances] = useState<Record<string, number | null>>({});
  const [loadingDistances, setLoadingDistances] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const getDishForOrder = (order: Order): Dish | undefined => {
    return allDishes.find(dish => dish.id === order.dishId);
  }

  useEffect(() => {
    // Fetch distances for available orders when the component mounts
    const availableOrders = orders.filter(o => o.status === "Ready for Pickup" && !o.driverId);
    availableOrders.forEach(order => {
      if (distances[order.id] === undefined && !loadingDistances[order.id]) {
        handleEstimateDistance(order);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);


  const myDeliveries = orders.filter(o => o.driverId === 'driver-123' && o.status !== 'Delivered');
  const hasActiveDelivery = myDeliveries.length > 0;
  
  const getCookForDish = (dish: Dish): {name: string, location: string} => {
    // In a real app, this would look up the cook's profile
    return { name: dish.cook, location: '123 Cook St, Santiago' };
  }
  
  const getCustomerAddress = (order: Order): string => {
    // In a real app, this would come from the order details
    return `456 Customer Ave, Santiago`;
  }

  const handleEstimateDistance = async (order: Order) => {
    const dish = getDishForOrder(order);
    if (!dish) return;

    setLoadingDistances(prev => ({...prev, [order.id]: true}));
    
    const cookAddress = getCookForDish(dish).location;
    const customerAddress = getCustomerAddress(order);

    try {
      const result = await estimateTravelDistance({
        startAddress: cookAddress,
        endAddress: customerAddress,
      });
      setDistances(prev => ({...prev, [order.id]: result.distanceKm}));
    } catch(e) {
      console.error("Failed to estimate distance", e);
      setDistances(prev => ({...prev, [order.id]: null})); // Or a fallback
    } finally {
      setLoadingDistances(prev => ({...prev, [order.id]: false}));
    }
  }
  
  const handleAcceptDelivery = (orderId: string) => {
    if (hasActiveDelivery) {
        toast({
            variant: "destructive",
            title: "Cannot Accept Job",
            description: "You must complete your active delivery before accepting a new one.",
        });
        return;
    }
    const centralOrder = allOrders.find(o => o.id === orderId);
    if (centralOrder) {
      centralOrder.driverId = 'driver-123'; // Assign a driver
      centralOrder.driverETA = Math.floor(Math.random() * 10) + 5; // Simulate ETA
    }
    setOrders([...allOrders]);
  }

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
     // Find the original order in the central 'database' and update it
    const centralOrder = allOrders.find(o => o.id === orderId);
    if(centralOrder) {
      centralOrder.status = newStatus;
    }
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

  const sortedAvailableDeliveries = useMemo(() => {
    const available = orders.filter(o => o.status === "Ready for Pickup" && !o.driverId);
    
    return available.sort((a, b) => {
      const dishA = getDishForOrder(a);
      const dishB = getDishForOrder(b);
      const distanceA = distances[a.id];
      const distanceB = distances[b.id];

      // If data is missing, keep original order or push to end
      if (!dishA || !dishB) return 0;
      if (distanceA === undefined || distanceB === undefined || distanceA === null || distanceB === null) return 0;

      const earningsA = dishA.price * a.quantity * DRIVER_CUT;
      const earningsB = dishB.price * b.quantity * DRIVER_CUT;
      
      // Handle division by zero for very short distances
      const scoreA = distanceA > 0 ? earningsA / distanceA : Infinity;
      const scoreB = distanceB > 0 ? earningsB / distanceB : Infinity;

      return scoreB - scoreA; // Sort descending by score
    });
  }, [orders, distances]);
  
  const renderOrderCard = (order: Order) => {
    const dish = getDishForOrder(order);
    if (!dish) return null;
    
    const cook = getCookForDish(dish);
    const customerAddress = getCustomerAddress(order);
    const earnings = dish.price * order.quantity * DRIVER_CUT;
    const distance = distances[order.id];
    const isLoadingDistance = loadingDistances[order.id];
    
    const nextStatus = statusProgression[order.status];

    const isAvailable = order.status === 'Ready for Pickup' && !order.driverId;
    const isAccepted = order.status === 'Ready for Pickup' && order.driverId;
    const isOutForDelivery = order.status === 'Out for Delivery';
    
    let badgeVariant: "default" | "secondary" | "destructive" = 'secondary';
    if (isAccepted) badgeVariant = 'default';
    if (isOutForDelivery) badgeVariant = 'default';

    return (
      <Card key={order.id} className="shadow-lg">
        <CardHeader>
           <div className="flex justify-between items-start">
              <div>
                <CardTitle>Delivery Job #{order.id.substring(0, 6)}</CardTitle>
                <CardDescription>
                  <span className="font-semibold">{dish.name}</span> (x{order.quantity})
                </CardDescription>
              </div>
              <Badge variant={badgeVariant} className="capitalize">
                {isAccepted ? 'Accepted' : order.status}
              </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <ChefHat className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold">Pickup: {cook.location}</p>
              <p className="text-sm text-muted-foreground">From {cook.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold">Dropoff: {customerAddress}</p>
              <p className="text-sm text-muted-foreground">To {order.customerName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Your Earnings</p>
                <p className="text-sm text-primary font-bold">{formatPrice(earnings)}</p>
              </div>
            </div>
             <div className="flex items-center gap-3">
              <Map className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Distance</p>
                {isLoadingDistance ? (
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader className="h-4 w-4 animate-spin" /> Calculating...
                   </div>
                ) : (
                  <p className="text-sm font-bold">{distance ? `${distance.toFixed(1)} km` : 'N/A'}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end items-center gap-2">
            {isAvailable && (
              <Button onClick={() => handleAcceptDelivery(order.id)} disabled={hasActiveDelivery}>
                Accept Delivery
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {isAccepted && nextStatus && (
              <Button onClick={() => handleStatusUpdate(order.id, nextStatus)}>
                Mark as "{nextStatus}"
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {isOutForDelivery && (
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
              {sortedAvailableDeliveries.length > 0 ? (
                sortedAvailableDeliveries.map(order => renderOrderCard(order))
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
               {myDeliveries.length > 0 ? (
                myDeliveries.map(order => renderOrderCard(order))
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
