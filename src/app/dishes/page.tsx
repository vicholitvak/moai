import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { allDishes } from '@/lib/data';

export default function ViewAllDishesPage() {
  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-headline">All Available Dishes</h1>
          <p className="text-muted-foreground">Browse all the delicious meals ready to be delivered to your door.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allDishes.map((dish) => (
             <Link key={dish.id} href={`/dishes/${dish.id}`} className="group transform transition-transform duration-300 hover:scale-105 block">
              <Card className="shadow-lg overflow-hidden flex flex-col h-full">
                <CardHeader className="p-0 relative">
                  <Image
                    src={dish.image}
                    alt={dish.name}
                    width={600}
                    height={400}
                    className="object-cover w-full h-48"
                    data-ai-hint={dish.hint}
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1.5 rounded-md">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold">{dish.rating}</span>
                    <span className="text-xs text-muted-foreground">({dish.reviews})</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1">
                  <CardTitle className="font-headline text-xl mb-1">{dish.name}</CardTitle>
                  <CardDescription>by {dish.cook}</CardDescription>
                  <div className="mt-2 flex gap-2 flex-wrap">
                      {dish.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 mt-auto">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-xl font-semibold text-primary">${dish.price}</p>
                    <Button>Order Now</Button>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
