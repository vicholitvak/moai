"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import withRoleAuth from "@/components/auth/withRoleAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Bike } from "lucide-react";

interface Order {
  id: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  total: number;
  // Add other order fields as needed
}

function FindDeliveriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Query for orders that are paid and ready for pickup
    const q = query(collection(firestore, "orders"), where("status", "==", "paid"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setAvailableOrders(ordersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching available deliveries:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptDelivery = async (orderId: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }

    try {
      const orderRef = doc(firestore, "orders", orderId);
      await updateDoc(orderRef, {
        driverId: user.uid,
        status: "delivering", // Update status to show it's been taken
      });
      toast({ title: "Delivery accepted!", description: "The order has been assigned to you." });
    } catch (error) {
      console.error("Error accepting delivery:", error);
      toast({ variant: "destructive", title: "Failed to accept delivery." });
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline">Available Deliveries</h1>
        <p className="text-muted-foreground">Find and accept new delivery jobs.</p>
      </div>

      {isLoading ? (
        <p>Searching for available deliveries...</p>
      ) : availableOrders.length === 0 ? (
        <div className="text-center py-10">
          <Bike className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No deliveries available</h3>
          <p className="mt-1 text-sm text-gray-500">Check back soon for new delivery opportunities.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>Delivery to {order.address.city}</CardTitle>
                <CardDescription>{order.address.street}, {order.address.postalCode}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Order details will be available upon acceptance.</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <p className="text-lg font-bold">Est. Fee: ${(order.total * 0.10).toFixed(2)}</p>
                <Button onClick={() => handleAcceptDelivery(order.id)}>Accept Delivery</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default withRoleAuth(FindDeliveriesPage, ['delivery']);