"use client";

import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dish } from "@/types";

function BrowseDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    // Query for active dishes
    const q = query(collection(firestore, "dishes"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dishesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dish));
      setDishes(dishesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching dishes:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-headline">Dishes Near You</h1>
        <p className="text-muted-foreground">
          Discover delicious homemade meals from local cooks.
        </p>
      </div>

      {isLoading ? (
        <p>Loading dishes...</p>
      ) : dishes.length === 0 ? (
        <p>No dishes available at the moment. Check back soon!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dishes.map((dish) => (
            <Card key={dish.id} className="flex flex-col">
              <CardHeader className="p-0">
                <Image src={dish.imageUrl} alt={dish.name} width={400} height={200} className="rounded-t-lg object-cover aspect-video" />
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="font-headline text-xl mb-2">{dish.name}</CardTitle>
                <CardDescription className="mb-4 text-sm">{dish.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center">
                <p className="text-lg font-bold">${dish.price.toFixed(2)}</p>
                <Button onClick={() => addToCart(dish)}>Add to Cart</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default BrowseDishesPage;