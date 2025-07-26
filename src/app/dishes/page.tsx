
"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MapPin } from 'lucide-react';
import { allDishes, allCooks } from '@/lib/data';
import type { Dish } from '@/lib/data';
import { formatPrice } from '@/lib/utils';

export default function ViewAllDishesPage() {
  const [sortOption, setSortOption] = useState('distance');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = useMemo(() => {
    const allTags = allDishes.flatMap(dish => dish.tags);
    return ['all', ...Array.from(new Set(allTags))];
  }, []);

  const sortedAndFilteredDishes = useMemo(() => {
    const availableCookIds = allCooks.filter(c => c.isAvailable).map(c => c.id);
    let dishes: Dish[] = allDishes.filter(dish => availableCookIds.includes(dish.cookId));

    // Filter
    if (filterCategory !== 'all') {
      dishes = dishes.filter(dish => dish.tags.includes(filterCategory));
    }

    // Sort
    switch (sortOption) {
      case 'distance':
        dishes.sort((a, b) => a.distance - b.distance);
        break;
      case 'rating':
        dishes.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_asc':
        dishes.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        dishes.sort((a, b) => b.price - a.price);
        break;
    }

    return dishes;
  }, [sortOption, filterCategory]);

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-headline">All Available Dishes</h1>
          <p className="text-muted-foreground">Browse all the delicious meals ready to be delivered to your door.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance (nearest)</SelectItem>
                <SelectItem value="rating">Rating (highest)</SelectItem>
                <SelectItem value="price_asc">Price (low to high)</SelectItem>
                <SelectItem value="price_desc">Price (high to low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm font-medium">Category:</span>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedAndFilteredDishes.map((dish) => (
             <Card key={dish.id} className="shadow-lg overflow-hidden flex flex-col h-full group transform transition-transform duration-300 hover:scale-105">
                <CardHeader className="p-0 relative">
                  <Link href={`/dishes/${dish.id}`}>
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      width={600}
                      height={400}
                      className="object-cover w-full h-48"
                      data-ai-hint={dish.hint}
                    />
                  </Link>
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1.5 rounded-md">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold">{dish.rating}</span>
                    <span className="text-xs text-muted-foreground">({dish.reviews})</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1">
                  <CardTitle className="font-headline text-xl mb-1">
                    <Link href={`/dishes/${dish.id}`} className="hover:underline">{dish.name}</Link>
                  </CardTitle>
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
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
