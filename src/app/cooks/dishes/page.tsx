"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DishForm } from "@/components/forms/DishForm";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";

function MyDishesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dishes, setDishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(firestore, "dishes"), where("cookerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dishesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDishes(dishesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleEdit = (dish: any) => {
    setEditingDish(dish);
    setIsDialogOpen(true);
  };

  const handleDelete = async (dishId: string) => {
    if (window.confirm("Are you sure you want to delete this dish?")) {
      try {
        await deleteDoc(doc(firestore, "dishes", dishId));
        toast({ title: "Dish deleted successfully." });
      } catch (error) {
        console.error("Error deleting dish:", error);
        toast({ variant: "destructive", title: "Failed to delete dish." });
      }
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline">My Dishes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDish(null)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Dish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingDish ? "Edit Dish" : "Add a New Dish"}</DialogTitle>
              <DialogDescription>
                {editingDish ? "Update the details of your dish." : "Fill in the details to add a new dish to your menu."}
              </DialogDescription>
            </DialogHeader>
            <DishForm onFinished={() => setIsDialogOpen(false)} initialData={editingDish} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Loading your dishes...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <Card key={dish.id} className="flex flex-col">
              <CardHeader className="p-0">
                <Image src={dish.imageUrl} alt={dish.name} width={400} height={200} className="rounded-t-lg object-cover aspect-video" />
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="font-headline text-xl mb-2">{dish.name}</CardTitle>
                <CardDescription className="mb-4">{dish.description}</CardDescription>
                 <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Prep Time: {dish.prepTime} mins</span>
                  <span className={`font-semibold ${dish.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {dish.isActive ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center">
                <p className="text-lg font-bold">${dish.price.toFixed(2)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(dish)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(dish.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default withRoleAuth(MyDishesPage, ['cooker']);