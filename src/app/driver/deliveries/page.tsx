
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { allOrders, allDishes, type Order, type OrderStatus, type Dish } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Truck, MapPin, ChefHat, Package, CheckCheck, KeyRound, Wallet, Loader, Map } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { estimateTravelDistance } from "@/ai/flows/estimate-travel-distance-flow";
import { PreparationTimer } from "@/components/preparation-timer";

const DRIVER_CUT = 0.10; // 10% of the dish price
const DRIVER_ID = 'driver-123';
const DRIVER_NAME = 'Daniel';

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

   useEffect(() => {
    // In a real app with a database, you'd use a real-time listener (like Firestore's onSnapshot)
    // to get live updates. For now, we'll use a polling mechanism to simulate this.
    const interval = setInterval(() => {
        setOrders([...allOrders]);
    }, 2000); // Check for updates every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const getDishForOrder = (order: Order): Dish | undefined => {
    return allDishes.find(dish => dish.id === order.dishId);
  }

  const getCookForDish = useCallback((dish: Dish): {name: string, location: string} => {
    // In a real app, this would look up the cook's profile
    return { name: dish.cook, location: '123 Cook St, Santiago' };
  }, []);
  
  const getCustomerAddress = useCallback((order: Order): string => {
    // In a real app, this would come from the order details
    return `456 Customer Ave, Santiago`;
  }, []);

  const handleEstimateDistance = useCallback(async (order: Order) => {
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
  }, [getCookForDish, getCustomerAddress, getDishForOrder]);

  useEffect(() => {
    // Fetch distances for available orders when the component mounts
    const availableOrders = orders.filter(o => o.status === "Ready for Pickup" && !o.driverId);
    availableOrders.forEach(order => {
      if (distances[order.id] === undefined && !loadingDistances[order.id]) {
        handleEstimateDistance(order);
      }
    });
  }, [orders, handleEstimateDistance, loadingDistances, distances]);


  const myDeliveries = useMemo(() => orders.filter(o => o.driverId === DRIVER_ID && o.status !== 'Delivered'), [orders]);
  const hasActiveDelivery = useMemo(() => myDeliveries.length > 0, [myDeliveries]);
  
  
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
      centralOrder.driverId = DRIVER_ID;
      centralOrder.driverName = DRIVER_NAME;
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
  }, [orders, distances, getDishForOrder]);

  const incomingDeliveries = useMemo(() => orders.filter(o => o.status === "Preparing Food"), [orders]);
  
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
    const isAccepted = order.status === 'Ready for Pickup' && order.driverId === DRIVER_ID;
    const isOutForDelivery = order.status === 'Out for Delivery' && order.driverId === DRIVER_ID;
    const isPreparing = order.status === 'Preparing Food';
    
    let badgeVariant: "default" | "secondary" | "destructive" = 'secondary';
    if (isAccepted || isOutForDelivery) badgeVariant = 'default';
    if (isPreparing) badgeVariant = 'destructive';

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
           {isPreparing && order.prepStartedAt && (
            <div className="border-t pt-4">
              <PreparationTimer prepTimeMinutes={dish.prepTimeMinutes} prepStartedAt={order.prepStartedAt} />
            </div>
          )}
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
             {isPreparing && (
                <p className="text-sm text-muted-foreground">This order will be available for pickup soon.</p>
            )}
        </CardFooter>
      </Card>
    )
  }
  

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-headline">Driver's Hub</h1>
          <p className="text-muted-foreground">Find and manage your deliveries.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-headline mb-4 flex items-center gap-2">
               <Truck className="h-6 w-6 text-primary" />
              My Active Delivery
            </h2>
            <div className="space-y-6">
               {myDeliveries.length > 0 ? (
                myDeliveries.map(order => renderOrderCard(order))
              ) : (
                <Card className="text-center p-8">
                  <CardContent>
                    <p className="text-muted-foreground">You have no active delivery.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <div className="md:col-span-2 grid md:grid-cols-2 gap-8">
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
                    <ChefHat className="h-6 w-6 text-primary" />
                    Incoming
                </h2>
                <div className="space-y-6">
                    {incomingDeliveries.length > 0 ? (
                        incomingDeliveries.map(order => renderOrderCard(order))
                    ) : (
                        <Card className="text-center p-8">
                        <CardContent>
                            <p className="text-muted-foreground">No orders are currently being prepared.</p>
                        </CardContent>
                        </Card>
                    )}
                </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

    