
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { firestore } from "@/lib/firebaseConfig";
import { allDishes, type Order, type OrderStatus, type Dish } from "@/lib/data"; // Keep dishes for now
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  ChevronRight,
  PackageCheck,
  ChefHat,
  Clock,
  Loader,
  Truck,
} from "lucide-react";
import { estimatePrepStartTime, EstimatePrepStartTimeOutput } from "@/ai/flows/estimate-delivery-time-flow";
import { PreparationTimer } from "@/components/preparation-timer";
import { DriverTrackingMap } from "@/components/driver-tracking-map";


const statusProgression: Record<OrderStatus, OrderStatus | null> = {
  "Order Placed": "Preparing Food",
  "Preparing Food": "Ready for Pickup",
  "Ready for Pickup": null, // Driver takes over from here
  "Out for Delivery": null,
  "Delivered": null,
};


export default function CookOrdersPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [prepTimes, setPrepTimes] = useState<Record<string, EstimatePrepStartTimeOutput | null>>({});
  const [loadingTimes, setLoadingTimes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userProfile) {
      if (!authLoading) setPageLoading(false);
      return;
    }

    if (userProfile.role !== 'cooker') {
      setPageLoading(false);
      return;
    }

    // Set up a real-time listener for orders assigned to this cook.
    // NOTE: This assumes your 'orders' collection documents have a 'cookId' field.
    const ordersRef = collection(firestore, "orders");
    const q = query(ordersRef, where("cookId", "==", userProfile.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(fetchedOrders);
      setPageLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [userProfile, authLoading]);

  const handleUpdateStatus = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const nextStatus = statusProgression[order.status];
    if (nextStatus) {
      const orderRef = doc(firestore, "orders", orderId);
      const updatePayload: any = { status: nextStatus };

      if (nextStatus === "Preparing Food") {
        updatePayload.prepStartedAt = serverTimestamp();
      }
      
      await updateDoc(orderRef, updatePayload);
    }
  };
  
  const getDishForOrder = (order: Order): Dish | undefined => {
    return allDishes.find(dish => dish.id === order.dishId);
  };

  const handleEstimateTime = async (order: Order) => {
    const dish = getDishForOrder(order);
    if (!dish) return;

    setLoadingTimes(prev => ({ ...prev, [order.id]: true }));
    setPrepTimes(prev => ({ ...prev, [order.id]: null }));

    // In a real app, addresses would be dynamic
    const cookAddress = "123 Cook St, Santiago";
    const customerAddress = "456 Customer Ave, Santiago";
    
    try {
      const result = await estimatePrepStartTime({
        cookAddress,
        customerAddress,
        prepTimeMinutes: dish.prepTimeMinutes,
      });
      setPrepTimes(prev => ({ ...prev, [order.id]: result }));
    } catch (e) {
      console.error(e);
      // Handle error case if needed
    } finally {
      setLoadingTimes(prev => ({ ...prev, [order.id]: false }));
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'Delivered');

  if (authLoading || pageLoading) {
    return (
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (userProfile?.role !== 'cooker') {
    return (
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You must be a cook to view this page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-headline">Active Orders</h1>
          <p className="text-muted-foreground">Manage incoming orders and update their status.</p>
        </div>

        <div className="space-y-6">
          {activeOrders.length === 0 && (
            <Card className="text-center p-8">
                <CardContent>
                    <PackageCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">All Caught Up!</h3>
                    <p className="text-muted-foreground">You have no active orders right now.</p>
                </CardContent>
            </Card>
          )}
          {activeOrders.map(order => {
            const dish = getDishForOrder(order);
            const nextStatus = statusProgression[order.status];
            const prepTime = prepTimes[order.id];
            const isLoading = loadingTimes[order.id];

            if (!dish) return null;

            const badgeVariant = {
              "Order Placed": "destructive",
              "Preparing Food": "default",
              "Ready for Pickup": "secondary",
              "Out for Delivery": "secondary",
              "Delivered": "secondary",
            }[order.status] || "default";
            
            const isDriverAssigned = !!order.driverId;

            return (
              <Card key={order.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Order #{order.id.substring(0, 6)}</CardTitle>
                      <CardDescription>For {order.customerName}</CardDescription>
                    </div>
                    <Badge variant={badgeVariant as any} className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                   {order.status === 'Preparing Food' && order.prepStartedAt && (
                      <PreparationTimer prepTimeMinutes={dish.prepTimeMinutes} prepStartedAt={order.prepStartedAt} />
                   )}
                   
                   {order.status === 'Ready for Pickup' && isDriverAssigned && order.driverETA && (
                      <>
                        <Alert variant="default" className="border-primary/50">
                          <Truck className="h-4 w-4" />
                          <AlertTitle>Driver Assigned!</AlertTitle>
                          <AlertDescription>
                            Your driver, <span className="font-bold">{order.driverName}</span>, is on their way. Estimated arrival in <span className="font-bold">{order.driverETA} minutes</span>.
                          </AlertDescription>
                        </Alert>
                        <DriverTrackingMap initialETA={order.driverETA} />
                      </>
                   )}
                   {order.status === 'Ready for Pickup' && !isDriverAssigned && (
                     <Alert>
                        <Truck className="h-4 w-4" />
                        <AlertTitle>Waiting for Driver</AlertTitle>
                        <AlertDescription>
                          The order is ready. We are assigning a driver for pickup.
                        </AlertDescription>
                      </Alert>
                   )}

                   {prepTime && !isDriverAssigned && order.status === 'Order Placed' && (
                     <Alert>
                        <ChefHat className="h-4 w-4" />
                        <AlertTitle>AI Recommendation</AlertTitle>
                        <AlertDescription>
                          To ensure a fresh delivery, please start preparing this order at <span className="font-bold text-primary">{prepTime.recommendedPrepStartTime}</span>. The driver is estimated to arrive at {prepTime.estimatedDriverArrivalTime}.
                        </AlertDescription>
                      </Alert>
                   )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <div>
                    {order.status === 'Order Placed' && (
                      <Button variant="outline" onClick={() => handleEstimateTime(order)} disabled={isLoading}>
                         {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                        When should I start?
                      </Button>
                    )}
                  </div>
                  {nextStatus ? (
                     <Button onClick={() => handleUpdateStatus(order.id)}>
                        <span>Mark as "{nextStatus}"</span>
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                       {order.status === 'Ready for Pickup' ? (
                          <>
                            <Truck className="h-4 w-4" />
                            <span>
                                {isDriverAssigned ? "Driver is on the way!" : "Waiting for driver..."}
                            </span>
                          </>
                       ) : (
                           <>
                               <PackageCheck className="h-4 w-4" />
                               <span>Order is complete!</span>
                           </>
                       )}
                    </div>
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
