
"use client";

import { useState } from "react";
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import { allDishes, type Dish as DishType } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

// In a real app, this would be the logged-in cook's ID
const CURRENT_COOK_ID = 'cook-isabella';

export default function CookDishesPage() {
  const [dishes, setDishes] = useState<DishType[]>(allDishes.filter(d => d.cookId === CURRENT_COOK_ID));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DishType | null>(null);

  const handleEditClick = (dish: DishType) => {
    setEditingDish(dish);
    setIsDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingDish(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingDish(null);
  };

  const handleSaveDish = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newDishData = {
      name: formData.get('dish-name') as string,
      description: formData.get('description') as string,
      price: parseInt(formData.get('price') as string, 10),
      image: editingDish?.image || 'https://placehold.co/600x400.png',
      hint: editingDish?.hint || 'food placeholder',
      prepTimeMinutes: 20, // Placeholder
    };

    if (editingDish) {
      // Update existing dish in the central allDishes array
      const dishIndex = allDishes.findIndex(d => d.id === editingDish.id);
      if (dishIndex !== -1) {
        const updatedDish = { ...allDishes[dishIndex], ...newDishData };
        allDishes[dishIndex] = updatedDish;
      }
    } else {
      // Add new dish to the central allDishes array
      const newDish: DishType = {
        id: (allDishes.length + 1).toString(),
        cook: "Chef Isabella", // Assuming the current cook
        cookId: CURRENT_COOK_ID,
        rating: 0,
        reviews: 0,
        tags: [],
        distance: 2.5, // Placeholder
        chefDescription: "A new delicious creation!", // Placeholder
        ...newDishData,
      };
      allDishes.unshift(newDish); // Add to the beginning of the list
    }

    // Refresh local state to reflect changes from the central array
    setDishes([...allDishes.filter(d => d.cookId === CURRENT_COOK_ID)]);
    handleDialogClose();
  };

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-headline">Your Dishes</h1>
          <Button onClick={handleAddNewClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Dish
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleSaveDish}>
              <DialogHeader>
                <DialogTitle className="font-headline">{editingDish ? "Edit Dish" : "Add a New Dish"}</DialogTitle>
                <DialogDescription>
                  {editingDish ? "Update the details for your menu item." : "Fill out the details for your new menu item."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dish-name" className="text-right">Name</Label>
                  <Input id="dish-name" name="dish-name" defaultValue={editingDish?.name} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingDish?.description} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Price (CLP)</Label>
                  <Input id="price" name="price" type="number" step="1" defaultValue={editingDish?.price} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="picture" className="text-right">
                        Image
                    </Label>
                    <Input id="picture" type="file" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Dish</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dishes.map((dish) => (
            <Card key={dish.id} className="shadow-lg overflow-hidden flex flex-col group transform transition-transform duration-300 hover:scale-105">
              <CardHeader className="p-0">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  width={600}
                  height={400}
                  className="object-cover w-full h-48"
                  data-ai-hint={dish.hint}
                />
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <CardTitle className="font-headline text-xl mb-2">{dish.name}</CardTitle>
                <CardDescription>{dish.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto">
                <div className="flex justify-between items-center w-full">
                  <p className="text-lg font-semibold text-primary">{formatPrice(dish.price)}</p>
                  <Button variant="outline" onClick={() => handleEditClick(dish)}>Edit</Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
