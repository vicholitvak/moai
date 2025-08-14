'use client';

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Star, 
  Clock, 
  Heart,
  ShoppingCart,
  Sparkles,
  Truck,
  Leaf,
  ChefHat,
  Users,
  Award,
  Eye,
  Info
} from 'lucide-react';
import { Dish, Cook } from '@/lib/firebase/dataService';
import { formatPrice } from '@/lib/utils';
import { SmartBadgeService, type DishWithBadges } from '@/lib/services/smartBadgeService';

interface EnhancedDishCardProps {
  dish: DishWithBadges;
  onDishClick: (dishId: string) => void;
  onFavoriteToggle: (dishId: string) => void;
  user: any;
  size?: 'small' | 'medium' | 'large' | 'featured';
  showNutrition?: boolean;
  hasDiscount?: boolean;
  discountPercentage?: number;
  popularityScore?: number;
  recommendationContext?: {
    isFromRecommendation: boolean;
    recommendationType?: string;
  };
}

export default function EnhancedDishCard({
  dish,
  onDishClick,
  onFavoriteToggle,
  user,
  size = 'medium',
  showNutrition = false,
  hasDiscount = false,
  discountPercentage = 0,
  popularityScore = 0,
  recommendationContext
}: EnhancedDishCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showNutritionInfo, setShowNutritionInfo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate card dimensions based on size
  const cardDimensions = {
    small: 'w-full max-w-sm',
    medium: 'w-full',
    large: 'w-full',
    featured: 'w-full col-span-2 row-span-2'
  };

  const imageDimensions = {
    small: 'h-48',
    medium: 'h-56',
    large: 'h-64',
    featured: 'h-80'
  };

  // Calculate smart badges using consolidated system
  const smartBadges = SmartBadgeService.calculateBadges(dish, {
    isFromRecommendation: recommendationContext?.isFromRecommendation || false,
    recommendationType: recommendationContext?.recommendationType,
    maxBadges: 3
  });
  
  // Calculate nutrition score based on dish attributes
  const nutritionScore = dish.tags?.includes('saludable') || dish.tags?.includes('healthy') ? 
    Math.floor(Math.random() * 20) + 80 : // 80-100 for healthy dishes
    Math.floor(Math.random() * 30) + 50; // 50-80 for regular dishes
  
  // Get dietary badges for nutrition overlay
  const getDietaryBadges = () => {
    const badges = [];
    if (dish.tags?.includes('vegano') || dish.tags?.includes('vegan')) {
      badges.push({ text: 'Vegano', icon: Leaf, color: 'bg-green-500' });
    }
    if (dish.tags?.includes('saludable') || dish.tags?.includes('healthy')) {
      badges.push({ text: 'Saludable', icon: Sparkles, color: 'bg-blue-500' });
    }
    if (dish.tags?.includes('sin gluten') || dish.tags?.includes('gluten-free')) {
      badges.push({ text: 'Sin Gluten', icon: Award, color: 'bg-purple-500' });
    }
    return badges;
  };

  const dietaryBadges = getDietaryBadges();

  // Calculate original price if there's a discount
  const originalPrice = hasDiscount ? Math.round(dish.price / (1 - discountPercentage / 100)) : dish.price;
  const savings = originalPrice - dish.price;

  return (
    <Card 
      className={`${cardDimensions[size]} overflow-hidden transition-all duration-500 cursor-pointer group hover:shadow-2xl hover:scale-105 ${isHovered ? 'z-10' : 'z-0'} ${size === 'featured' ? 'shadow-xl border-2 border-purple-200' : 'shadow-md'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onDishClick(dish.id)}
    >
      <div className="relative overflow-hidden">
        {/* Main Image */}
        <div className={`${imageDimensions[size]} relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200`}>
          <img
            src={dish.image}
            alt={dish.name}
            className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
              setImageLoaded(true);
            }}
          />
          
          {/* Loading shimmer effect */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
          )}

          {/* Smart Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {smartBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <Badge 
                  key={badge.id}
                  className={`${badge.color} text-white border-0 backdrop-blur-sm shadow-lg ${badge.animated ? 'animate-pulse' : ''}`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {badge.label}
                </Badge>
              );
            })}
          </div>

          {/* Top right actions */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/80 hover:bg-white backdrop-blur-sm shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle(dish.id);
              }}
            >
              <Heart className={`h-4 w-4 transition-colors ${dish.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </Button>
            
            {showNutrition && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-white/80 hover:bg-white backdrop-blur-sm shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNutritionInfo(!showNutritionInfo);
                }}
              >
                <Info className="h-4 w-4 text-gray-600" />
              </Button>
            )}
          </div>

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-3 right-3 left-3 flex justify-center">
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg transform -rotate-3 animate-bounce">
                -{discountPercentage}% OFF
              </Badge>
            </div>
          )}

          {/* Availability status */}
          <div className="absolute bottom-3 left-3">
            <Badge variant={dish.isAvailable ? 'default' : 'secondary'} className="shadow-lg backdrop-blur-sm">
              {dish.isAvailable ? 'Disponible' : 'Agotado'}
            </Badge>
          </div>

          {/* Popularity indicator */}
          {popularityScore > 0 && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-orange-500/90 text-white border-0 backdrop-blur-sm shadow-lg">
                <Users className="h-3 w-3 mr-1" />
                {popularityScore} pedidos hoy
              </Badge>
            </div>
          )}

          {/* Hover overlay with quick actions */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute bottom-4 left-4 right-4 space-y-2">
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Ver detalles</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{dish.rating}</span>
                  <span className="text-gray-300">({dish.reviewCount})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nutrition Info Overlay */}
        {showNutritionInfo && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-4 flex flex-col justify-center text-center">
            <h4 className="font-bold mb-3 text-gray-800">Información Nutricional</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Score nutricional:</span>
                <span className={`font-bold ${nutritionScore >= 80 ? 'text-green-600' : nutritionScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {nutritionScore}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span>Calorías aprox:</span>
                <span>{dish.calories || (Math.floor(Math.random() * 400) + 200)} cal</span>
              </div>
              <div className="flex justify-between">
                <span>Tiempo prep:</span>
                <span>{dish.prepTime}</span>
              </div>
              {dietaryBadges.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {dietaryBadges.map((badge, index) => {
                      const Icon = badge.icon;
                      return (
                        <Badge key={index} className={`${badge.color} text-white text-xs`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {badge.text}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CardContent className={`p-4 ${size === 'featured' ? 'p-6' : ''}`}>
        <div className="space-y-3">
          {/* Title and price */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-gray-900 line-clamp-1 ${size === 'featured' ? 'text-xl' : 'text-lg'}`}>
                {dish.name}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                {dish.description}
              </p>
            </div>
            <div className="ml-3 text-right flex-shrink-0">
              {hasDiscount ? (
                <div>
                  <div className="text-xs text-gray-500 line-through">
                    {formatPrice(originalPrice)}
                  </div>
                  <div className={`font-bold text-red-600 ${size === 'featured' ? 'text-xl' : 'text-lg'}`}>
                    {formatPrice(dish.price)}
                  </div>
                  <div className="text-xs text-green-600">
                    Ahorra {formatPrice(savings)}
                  </div>
                </div>
              ) : (
                <div className={`font-bold text-gray-900 ${size === 'featured' ? 'text-xl' : 'text-lg'}`}>
                  {formatPrice(dish.price)}
                </div>
              )}
            </div>
          </div>

          {/* Cook info */}
          <div className="flex items-center space-x-2 text-sm">
            <Avatar className="h-6 w-6">
              <AvatarImage src={dish.cookerAvatar} />
              <AvatarFallback>
                <ChefHat className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="text-gray-600">por</span>
            <span className="font-medium text-gray-800 truncate">{dish.cookerName}</span>
            <div className="flex items-center">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="text-xs">{dish.cookerRating}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{dish.rating}</span>
                <span className="text-gray-400 ml-1">({dish.reviewCount})</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{dish.prepTime}</span>
              </div>
            </div>
            
            {dish.cookerSelfDelivery && (
              <div className="flex items-center text-green-600">
                <Truck className="h-4 w-4 mr-1" />
                <span className="text-xs">Entrega directa</span>
              </div>
            )}
          </div>

          {/* Dietary badges */}
          {dietaryBadges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dietaryBadges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {badge.text}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Action button */}
          <Button 
            className={`w-full transition-all duration-300 ${!dish.isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'} ${size === 'featured' ? 'h-12 text-lg' : ''}`}
            disabled={!dish.isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              onDishClick(dish.id);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {dish.isAvailable 
              ? (user ? 'Agregar al carrito' : 'Crear cuenta para pedir') 
              : 'No disponible'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}