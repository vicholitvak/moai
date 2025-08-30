'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Star, Clock, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { DishesService } from '@/lib/firebase/dataService';
import type { Dish } from '@/lib/firebase/dataService';

interface RecommendedPairingsProps {
  cookId: string;
  onAddToCart: (item: Dish) => void;
}

const RecommendedPairings: React.FC<RecommendedPairingsProps> = ({ cookId, onAddToCart }) => {
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [drinks, setDrinks] = useState<Dish[]>([]);
  const [sides, setSides] = useState<Dish[]>([]);

  useEffect(() => {
    const fetchPairings = async () => {
      try {
        setLoading(true);
        
        // Fetch all dishes from the same cook
        const cookDishes = await DishesService.getDishesByCook(cookId);
        
        // Filter dishes by category
        const drinkItems = cookDishes.filter(dish => 
          dish.category.toLowerCase() === 'bebidas' || 
          dish.category.toLowerCase() === 'drinks' ||
          dish.category.toLowerCase() === 'bebida'
        );
        
        const sideItems = cookDishes.filter(dish => 
          dish.category.toLowerCase() === 'acompañamientos' || 
          dish.category.toLowerCase() === 'sides' ||
          dish.category.toLowerCase() === 'acompañamiento' ||
          dish.category.toLowerCase() === 'entrada' ||
          dish.category.toLowerCase() === 'entrante'
        );
        
        setDrinks(drinkItems);
        setSides(sideItems);
        
      } catch (error) {
        console.error('Error fetching pairings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (cookId) {
      fetchPairings();
    }
  }, [cookId]);

  const handleAddToCart = (item: Dish) => {
    const cartItem = {
      dishId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      cookerName: item.cookerName,
      cookerId: item.cookerId,
      cookerAvatar: item.cookerAvatar,
      quantity: 1,
      prepTime: item.prepTime,
      category: item.category
    };
    
    onAddToCart(cartItem as any);
    setAddedItems(prev => new Set([...prev, item.id]));
    
    // Remove from added items after 2 seconds to allow re-adding
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 2000);
  };

  const ItemCard = ({ item }: { item: Dish }) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[3/2] relative">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDE1MCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MiAzN0g4OFY2M0g2MlYzN1oiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
          }}
        />
        <div className="absolute top-1 right-1">
          <Badge variant="secondary" className="text-xs">
            {item.category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
          <div className="text-right">
            <span className="font-bold text-primary">{formatPrice(item.price)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{item.prepTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{item.rating}</span>
          </div>
        </div>
        <Button 
          size="sm" 
          className="w-full text-xs h-7"
          disabled={!item.isAvailable}
          onClick={() => handleAddToCart(item)}
        >
          {addedItems.has(item.id) ? (
            <>Added!</>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't show the section if there are no pairings
  if (drinks.length === 0 && sides.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Recommended Drinks */}
      {drinks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🥤 Bebidas Perfectas
              <Badge variant="outline" className="text-xs">Del mismo cocinero</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {drinks.slice(0, 4).map((drink) => (
                <ItemCard key={drink.id} item={drink} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Sides */}
      {sides.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              🍞 Acompañamientos Ideales
              <Badge variant="outline" className="text-xs">Del mismo cocinero</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {sides.slice(0, 4).map((side) => (
                <ItemCard key={side.id} item={side} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendedPairings;