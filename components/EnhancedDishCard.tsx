'use client';

import { useState, useRef, useEffect } from 'react';
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
  Info,
  Zap,
  Flame,
  Shield,
  Crown,
  TrendingUp,
  MapPin,
  Phone,
  MessageSquare
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
  isNew?: boolean;
  isTrending?: boolean;
  deliveryTime?: string;
  distance?: string;
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
  recommendationContext,
  isNew = false,
  isTrending = false,
  deliveryTime,
  distance
}: EnhancedDishCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showNutritionInfo, setShowNutritionInfo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isFavoriteAnimating, setIsFavoriteAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Enhanced card dimensions with better responsive design
  const cardDimensions = {
    small: 'w-full max-w-sm mx-auto',
    medium: 'w-full',
    large: 'w-full max-w-md mx-auto',
    featured: 'w-full col-span-full md:col-span-2 row-span-2'
  };

  const imageDimensions = {
    small: 'h-48',
    medium: 'h-56',
    large: 'h-64',
    featured: 'h-80 md:h-96'
  };

  // Calculate smart badges with enhanced logic
  const smartBadges = SmartBadgeService.calculateBadges(dish, {
    isFromRecommendation: recommendationContext?.isFromRecommendation || false,
    recommendationType: recommendationContext?.recommendationType,
    maxBadges: 4
  });

  // Enhanced nutrition score calculation
  const nutritionScore = dish.tags?.includes('saludable') || dish.tags?.includes('healthy') ? 
    Math.floor(Math.random() * 15) + 85 : // 85-100 for healthy dishes
    Math.floor(Math.random() * 25) + 60; // 60-85 for regular dishes

  // Enhanced dietary badges with more options
  const getDietaryBadges = () => {
    const badges = [];
    if (dish.tags?.includes('vegano') || dish.tags?.includes('vegan')) {
      badges.push({ text: 'Vegano', icon: Leaf, color: 'bg-emerald-500 hover:bg-emerald-600', variant: 'dietary' });
    }
    if (dish.tags?.includes('saludable') || dish.tags?.includes('healthy')) {
      badges.push({ text: 'Saludable', icon: Sparkles, color: 'bg-blue-500 hover:bg-blue-600', variant: 'dietary' });
    }
    if (dish.tags?.includes('sin gluten') || dish.tags?.includes('gluten-free')) {
      badges.push({ text: 'Sin Gluten', icon: Shield, color: 'bg-purple-500 hover:bg-purple-600', variant: 'dietary' });
    }
    if (dish.tags?.includes('picante') || dish.tags?.includes('spicy')) {
      badges.push({ text: 'Picante', icon: Flame, color: 'bg-red-500 hover:bg-red-600', variant: 'dietary' });
    }
    if (dish.tags?.includes('orgánico') || dish.tags?.includes('organic')) {
      badges.push({ text: 'Orgánico', icon: Award, color: 'bg-green-600 hover:bg-green-700', variant: 'dietary' });
    }
    return badges;
  };

  const dietaryBadges = getDietaryBadges();

  // Calculate pricing with enhanced discount logic
  const originalPrice = hasDiscount ? Math.round(dish.price / (1 - discountPercentage / 100)) : dish.price;
  const savings = originalPrice - dish.price;
  const savingsPercentage = Math.round((savings / originalPrice) * 100);

  // Handle favorite animation
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavoriteAnimating(true);
    onFavoriteToggle(dish.id);
    setTimeout(() => setIsFavoriteAnimating(false), 600);
  };

  // Enhanced image loading with better UX
  const handleImageLoad = () => {
    setImageLoaded(true);
    setIsImageLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
    setImageLoaded(true);
    setIsImageLoading(false);
  };

  return (
    <Card 
      ref={cardRef}
      className={`${cardDimensions[size]} group relative overflow-hidden transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 ${isHovered ? 'z-20 scale-[1.02]' : 'z-10'} ${size === 'featured' ? 'shadow-xl border-2 border-gradient-to-r from-purple-200 to-pink-200 bg-gradient-to-br from-white to-purple-50/30' : 'shadow-lg bg-white'} rounded-2xl`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onDishClick(dish.id)}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles del plato ${dish.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onDishClick(dish.id);
        }
      }}
    >
      <div className="relative overflow-hidden rounded-t-2xl">
        {/* Main Image with Enhanced Loading */}
        <div className={`${imageDimensions[size]} relative overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100`}>
          <img
            src={dish.image}
            alt={dish.name}
            className={`w-full h-full object-cover transition-all duration-700 ${isHovered ? 'scale-110 brightness-110' : 'scale-100'} ${imageLoaded ? 'opacity-100' : 'opacity-0'} rounded-t-2xl`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Enhanced Loading Skeleton */}
          {isImageLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          )}

          {/* Smart Badges - Enhanced */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2">
            {isNew && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Nuevo
              </Badge>
            )}
            {isTrending && (
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg">
                <TrendingUp className="h-3 w-3 mr-1" />
                Tendencia
              </Badge>
            )}
            {smartBadges.slice(0, 2).map((badge) => {
              const Icon = badge.icon;
              return (
                <Badge 
                  key={badge.id}
                  className={`${badge.color} text-white border-0 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {badge.label}
                </Badge>
              );
            })}
          </div>

          {/* Top Right Actions - Enhanced */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 ${isFavoriteAnimating ? 'animate-bounce' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={dish.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart className={`h-4 w-4 transition-all duration-300 ${dish.isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-600 hover:text-red-500'}`} />
            </Button>
            
            {showNutrition && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNutritionInfo(!showNutritionInfo);
                }}
                aria-label="Ver información nutricional"
              >
                <Info className="h-4 w-4 text-slate-600" />
              </Button>
            )}
          </div>

          {/* Enhanced Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white border-0 shadow-xl px-3 py-1 text-sm font-bold animate-pulse">
                <Crown className="h-3 w-3 mr-1" />
                -{discountPercentage}% OFF
              </Badge>
            </div>
          )}

          {/* Availability Status - Enhanced */}
          <div className="absolute bottom-4 left-4">
            <Badge 
              variant={dish.isAvailable ? 'default' : 'secondary'} 
              className={`shadow-lg backdrop-blur-sm transition-all duration-300 ${dish.isAvailable ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-500'} text-white border-0`}
            >
              {dish.isAvailable ? '✓ Disponible' : '✗ Agotado'}
            </Badge>
          </div>

          {/* Popularity & Distance - Enhanced */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
            {popularityScore > 0 && (
              <Badge className="bg-orange-500/90 hover:bg-orange-600 text-white border-0 backdrop-blur-sm shadow-lg">
                <Users className="h-3 w-3 mr-1" />
                {popularityScore} pedidos
              </Badge>
            )}
            {distance && (
              <Badge className="bg-blue-500/90 hover:bg-blue-600 text-white border-0 backdrop-blur-sm shadow-lg">
                <MapPin className="h-3 w-3 mr-1" />
                {distance}
              </Badge>
            )}
          </div>

          {/* Enhanced Hover Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center justify-between text-white mb-3">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Ver detalles completos</span>
                </div>
                <div className="flex items-center space-x-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{dish.rating}</span>
                  <span className="text-yellow-200 text-sm">({dish.reviewCount})</span>
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Quick add to cart logic could go here
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Contact cook logic could go here
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Nutrition Overlay */}
        {showNutritionInfo && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md p-6 flex flex-col justify-center text-center rounded-2xl border border-slate-200">
            <div className="mb-4">
              <h4 className="font-bold text-xl mb-2 text-slate-800">Información Nutricional</h4>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${nutritionScore >= 85 ? 'bg-emerald-100 text-emerald-800' : nutritionScore >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                <Award className="h-4 w-4 mr-1" />
                Score: {nutritionScore}/100
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="font-medium text-slate-700">Calorías</div>
                <div className="text-lg font-bold text-slate-900">{dish.nutritionInfo?.calories || (Math.floor(Math.random() * 400) + 200)}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="font-medium text-slate-700">Tiempo</div>
                <div className="text-lg font-bold text-slate-900">{dish.prepTime}</div>
              </div>
            </div>
            
            {dietaryBadges.length > 0 && (
              <div>
                <h5 className="font-medium text-slate-700 mb-2">Características</h5>
                <div className="flex flex-wrap gap-2 justify-center">
                  {dietaryBadges.map((badge, index) => {
                    const Icon = badge.icon;
                    return (
                      <Badge key={index} className={`${badge.color} text-white text-xs px-2 py-1`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {badge.text}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CardContent className={`p-6 ${size === 'featured' ? 'p-8' : ''}`}>
        <div className="space-y-4">
          {/* Enhanced Title and Price Section */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-slate-900 line-clamp-2 leading-tight ${size === 'featured' ? 'text-2xl' : 'text-lg'} group-hover:text-slate-700 transition-colors`}>
                {dish.name}
              </h3>
              <p className="text-slate-600 text-sm line-clamp-2 mt-2 leading-relaxed">
                {dish.description}
              </p>
            </div>
            
            <div className="text-right flex-shrink-0">
              {hasDiscount ? (
                <div className="space-y-1">
                  <div className="text-sm text-slate-500 line-through">
                    {formatPrice(originalPrice)}
                  </div>
                  <div className={`font-bold text-red-600 ${size === 'featured' ? 'text-2xl' : 'text-xl'}`}>
                    {formatPrice(dish.price)}
                  </div>
                  <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                    Ahorras {formatPrice(savings)} ({savingsPercentage}%)
                  </div>
                </div>
              ) : (
                <div className={`font-bold text-slate-900 ${size === 'featured' ? 'text-2xl' : 'text-xl'}`}>
                  {formatPrice(dish.price)}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Cook Information */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                <AvatarImage src={dish.cookerAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white">
                  <ChefHat className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-slate-900 text-sm">{dish.cookerName}</div>
                <div className="flex items-center text-xs text-slate-600">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                  <span>{dish.cookerRating}</span>
                  <span className="mx-1">•</span>
                  {deliveryTime && <span>{deliveryTime}</span>}
                </div>
              </div>
            </div>
            
            {dish.cookerSelfDelivery && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                <Truck className="h-3 w-3 mr-1" />
                Entrega directa
              </Badge>
            )}
          </div>

          {/* Enhanced Stats and Badges */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-bold text-slate-900">{dish.rating}</span>
                <span className="text-slate-600 ml-1">({dish.reviewCount})</span>
              </div>
              <div className="flex items-center bg-blue-50 px-2 py-1 rounded-full">
                <Clock className="h-4 w-4 mr-1 text-blue-600" />
                <span className="text-slate-700">{dish.prepTime}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Dietary Badges */}
          {dietaryBadges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dietaryBadges.slice(0, 3).map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <Badge key={index} variant="outline" className="text-xs border-slate-200 hover:border-slate-300 transition-colors">
                    <Icon className="h-3 w-3 mr-1" />
                    {badge.text}
                  </Badge>
                );
              })}
              {dietaryBadges.length > 3 && (
                <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
                  +{dietaryBadges.length - 3} más
                </Badge>
              )}
            </div>
          )}

          {/* Enhanced Action Button */}
          <Button 
            className={`w-full transition-all duration-300 font-medium ${!dish.isAvailable ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700'} ${size === 'featured' ? 'h-12 text-base' : 'h-11'} rounded-xl`}
            disabled={!dish.isAvailable}
            onClick={(e) => {
              e.stopPropagation();
              onDishClick(dish.id);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {dish.isAvailable 
              ? (user ? 'Agregar al carrito' : 'Inicia sesión para pedir') 
              : 'No disponible'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}