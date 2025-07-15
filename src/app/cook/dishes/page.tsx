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
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import Image from "next/image";

const dishes = [
  {
    name: "Spaghetti Carbonara",
    description: "A classic Roman pasta dish with creamy egg sauce, pancetta, and pecorino cheese.",
    price: "18.50",
    image: "https://placehold.co/600x400.png",
    hint: "pasta italian"
  },
  {
    name: "Margherita Pizza",
    description: "Simple and delicious pizza with San Marzano tomatoes, fresh mozzarella, basil, and a drizzle of olive oil.",
    price: "15.00",
    image: "https://placehold.co/600x400.png",
    hint: "pizza italian"
  },
  {
    name: "Tiramisu",
    description: "A beloved Italian dessert with coffee-soaked ladyfingers, mascarpone cream, and a dusting of cocoa.",
    price: "9.50",
    image: "https://placehold.co/600x400.png",
    hint: "dessert sweet"
  },
  {
    name: "Chicken Parmesan",
    description: "Breaded chicken breast, fried and topped with marinara sauce and mozzarella, served with pasta.",
    price: "22.00",
    image: "https://placehold.co/600x400.png",
    hint: "chicken italian"
  },
];

export default function CookDishesPage() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-headline">Your Dishes</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Dish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="font-headline">Add a New Dish</DialogTitle>
                <DialogDescription>
                  Fill out the details for your new menu item.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dish-name" className="text-right">Name</Label>
                  <Input id="dish-name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea id="description" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Price ($)</Label>
                  <Input id="price" type="number" step="0.01" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prep-time" className="text-right">Prep Time (min)</Label>
                  <Input id="prep-time" type="number" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="picture" className="text-right">
                        Image
                    </Label>
                    <Input id="picture" type="file" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Dish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
                  <Button variant="outline">Edit</Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
