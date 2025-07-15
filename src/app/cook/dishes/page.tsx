
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

type Dish = {
  name: string;
  description: string;
  price: string;
  prepTime: number;
  image: string;
  hint: string;
};

const initialDishes: Dish[] = [
  {
    name: "Spaghetti Carbonara",
    description: "A classic Roman pasta dish with creamy egg sauce, pancetta, and pecorino cheese.",
    price: "18.50",
    prepTime: 25,
    image: "https://images.unsplash.com/photo-1588013273468-31508b946d4d?q=80&w=600",
    hint: "pasta italian"
  },
  {
    name: "Margherita Pizza",
    description: "Simple and delicious pizza with San Marzano tomatoes, fresh mozzarella, basil, and a drizzle of olive oil.",
    price: "15.00",
    prepTime: 20,
    image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?q=80&w=600",
    hint: "pizza italian"
  },
  {
    name: "Tiramisu",
    description: "A beloved Italian dessert with coffee-soaked ladyfingers, mascarpone cream, and a dusting of cocoa.",
    price: "9.50",
    prepTime: 15,
    image: "https://images.unsplash.com/photo-1571115332230-d9d68b7859a8?q=80&w=600",
    hint: "dessert sweet"
  },
  {
    name: "Chicken Parmesan",
    description: "Breaded chicken breast, fried and topped with marinara sauce and mozzarella, served with pasta.",
    price: "22.00",
    prepTime: 35,
    image: "https://images.unsplash.com/photo-1632778149955-e83f3ce9b6e5?q=80&w=600",
    hint: "chicken italian"
  },
];


export default function CookDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const handleEditClick = (dish: Dish) => {
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
    const updatedDish = {
      name: formData.get('dish-name') as string,
      description: formData.get('description') as string,
      price: formData.get('price') as string,
      prepTime: parseInt(formData.get('prep-time') as string, 10),
      image: editingDish?.image || 'https://placehold.co/600x400.png', 
      hint: editingDish?.hint || 'food placeholder'
    };

    if (editingDish) {
      // Update existing dish
      setDishes(dishes.map(d => d.name === editingDish.name ? updatedDish : d));
    } else {
      // Add new dish
      setDishes([...dishes, updatedDish]);
    }

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
                  <Label htmlFor="price" className="text-right">Price ($)</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingDish?.price} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prep-time" className="text-right">Prep Time (min)</Label>
                  <Input id="prep-time" name="prep-time" type="number" defaultValue={editingDish?.prepTime} className="col-span-3" />
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
            <Card key={dish.name} className="shadow-lg overflow-hidden flex flex-col group transform transition-transform duration-300 hover:scale-105">
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
                  <p className="text-lg font-semibold text-primary">${dish.price}</p>
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
