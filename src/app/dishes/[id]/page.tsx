import { notFound } from 'next/navigation';
import Image from 'next/image';
import { allDishes } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ChefHat, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function generateStaticParams() {
  return allDishes.map((dish) => ({
    id: dish.id,
  }));
}

export default function DishDetailPage({ params }: { params: { id: string } }) {
  const dish = allDishes.find((d) => d.id === params.id);

  if (!dish) {
    notFound();
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg">
              <Image
                src={dish.image}
                alt={dish.name}
                fill
                className="object-cover"
                data-ai-hint={dish.hint}
              />
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <div>
              <div className="flex gap-2 mb-2">
                {dish.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <h1 className="text-4xl font-headline">{dish.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ChefHat className="w-5 h-5" />
                  <span>{dish.cook}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-foreground">{dish.rating}</span>
                  <span>({dish.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                    <MapPin className="w-5 h-5" />
                    <span>{dish.distance} km away</span>
                </div>
              </div>
            </div>

            <p className="text-3xl font-bold text-primary">${dish.price}</p>
            
            <p className="text-muted-foreground">{dish.description}</p>

            <Button size="lg" className="w-full">Order Now</Button>

            <Separator className="my-4" />

            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">A word from the chef</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic">"{dish.chefDescription}"</p>
                </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </main>
  );
}
