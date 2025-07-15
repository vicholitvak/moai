
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, MapPin } from 'lucide-react';
import { allDishes, allCooks } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import { useMemo } from 'react';

export default function Home() {

  const availableDishes = useMemo(() => {
    const availableCookIds = allCooks.filter(c => c.isAvailable).map(c => c.id);
    return allDishes.filter(dish => availableCookIds.includes(dish.cookId)).slice(0, 6);
  }, []);


  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-headline">Available Now</h1>
          <Button variant="outline" asChild>
            <Link href="/dishes">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {availableDishes.map((dish) => (
            <Card key={dish.id} className="shadow-lg overflow-hidden flex flex-col h-full group transform transition-transform duration-300 hover:scale-105">
              <Link href={`/dishes/${dish.id}`} className="flex flex-col h-full">
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
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                    <CardDescription>by {dish.cook}</CardDescription>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{dish.distance} km</span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                      {dish.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 mt-auto">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-xl font-semibold text-primary">{formatPrice(dish.price)}</p>
                    <Button asChild>
                      <Link href={`/checkout/${dish.id}`}>Order Now</Link>
                    </Button>
                  </div>
                </CardFooter>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
