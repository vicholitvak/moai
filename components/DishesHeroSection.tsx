'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { 
  Star, 
  Clock, 
  MapPin, 
  Sparkles,
  TrendingUp,
  Crown,
  Flame,
  Heart,
  ArrowRight
} from 'lucide-react';
import { Dish, Cook } from '@/lib/firebase/dataService';
import { formatPrice } from '@/lib/utils';

interface DishWithCook extends Dish {
  cookerName: string;
  cookerAvatar: string;
  cookerRating: number;
  distance: string;
  isFavorite: boolean;
}

interface DishesHeroSectionProps {
  featuredDishes: DishWithCook[];
  onDishClick: (dishId: string) => void;
  onFavoriteToggle: (dishId: string) => void;
  timeOfDay: 'desayuno' | 'almuerzo' | 'cena' | 'bajón';
  user: any;
}

const timeOfDayContent = {
  desayuno: {
    title: 'Buenos días! 🌅',
    subtitle: 'Comienza tu día con energía',
    gradient: 'from-orange-400 via-pink-400 to-red-400',
    bgPattern: 'bg-gradient-to-br from-orange-50 to-pink-50',
    emoji: '☀️',
    suggestion: 'Desayunos nutritivos para arrancar el día'
  },
  almuerzo: {
    title: '¡Hora del almuerzo! 🍽️',
    subtitle: 'Recarga energías con sabores únicos',
    gradient: 'from-blue-400 via-purple-400 to-pink-400',
    bgPattern: 'bg-gradient-to-br from-blue-50 to-purple-50',
    emoji: '🌞',
    suggestion: 'Platos completos para el mediodía'
  },
  cena: {
    title: 'Buenas noches 🌙',
    subtitle: 'Cena deliciosa para cerrar el día',
    gradient: 'from-indigo-400 via-purple-400 to-pink-400',
    bgPattern: 'bg-gradient-to-br from-indigo-50 to-purple-50',
    emoji: '🌆',
    suggestion: 'Cenas reconfortantes y sabrosas'
  },
  bajón: {
    title: '¡Hora del bajón! 🌚',
    subtitle: 'Antojos nocturnos, te entendemos',
    gradient: 'from-purple-600 via-blue-600 to-indigo-600',
    bgPattern: 'bg-gradient-to-br from-purple-100 to-blue-100',
    emoji: '🌟',
    suggestion: 'Snacks y comidas para la madrugada'
  }
};

export default function DishesHeroSection({
  featuredDishes,
  onDishClick,
  onFavoriteToggle,
  timeOfDay,
  user
}: DishesHeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const currentTime = timeOfDayContent[timeOfDay];
  
  // Auto-rotate featured dishes every 5 seconds
  useEffect(() => {
    if (featuredDishes.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.min(featuredDishes.length, 3));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredDishes.length]);

  // Animation on mount
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const topDishes = featuredDishes.slice(0, 3);
  const currentFeaturedDish = topDishes[currentSlide];

  if (!currentFeaturedDish) {
    return (
      <div className={`relative overflow-hidden ${currentTime.bgPattern} rounded-2xl mb-8 p-8`}>
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl mb-8 ${currentTime.bgPattern} transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-y-1"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-12 translate-y-12"></div>
      </div>

      <div className="relative z-10 p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Time-based greeting */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl animate-pulse">{currentTime.emoji}</span>
                <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-white/20">
                  {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </div>
              
              <h1 className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${currentTime.gradient} bg-clip-text text-transparent`}>
                {currentTime.title}
              </h1>
              
              <p className="text-lg text-gray-700 font-medium">
                {currentTime.subtitle}
              </p>
              
              <p className="text-sm text-gray-600">
                {currentTime.suggestion}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <div className="text-xl font-bold text-gray-800">{featuredDishes.length}</div>
                <div className="text-xs text-gray-600">Platos disponibles</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <div className="text-xl font-bold text-gray-800">
                  {Math.round(featuredDishes.reduce((avg, dish) => avg + dish.rating, 0) / featuredDishes.length * 10) / 10}
                </div>
                <div className="text-xs text-gray-600">Rating promedio</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <div className="text-xl font-bold text-gray-800">~{Math.round(featuredDishes.reduce((avg, dish) => avg + (dish.prepTime as number || 30), 0) / featuredDishes.length)} min</div>
                <div className="text-xs text-gray-600">Tiempo promedio</div>
              </div>
            </div>

            {/* CTA */}
            {!user && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-sm text-gray-700 mb-3">
                  <Sparkles className="h-4 w-4 inline mr-1" />
                  Crea tu cuenta para desbloquear recomendaciones personalizadas
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  onClick={() => window.location.href = '/login'}
                >
                  Comenzar mi experiencia culinaria
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Right Content - Featured Dish Carousel */}
          <div className="relative">
            <Card className="overflow-hidden bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
              <div className="relative">
                <img
                  src={currentFeaturedDish.image}
                  alt={currentFeaturedDish.name}
                  className="w-full h-64 object-cover transition-transform duration-700 hover:scale-110"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
                  }}
                />
                
                {/* Overlay badges */}
                <div className="absolute top-4 left-4 space-y-2">
                  <Badge className="bg-red-500/90 text-white border-0 backdrop-blur-sm">
                    <Flame className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                  {currentFeaturedDish.rating >= 4.5 && (
                    <Badge className="bg-yellow-500/90 text-white border-0 backdrop-blur-sm">
                      <Crown className="h-3 w-3 mr-1" />
                      Top Rated
                    </Badge>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 h-10 w-10 p-0 bg-white/80 hover:bg-white backdrop-blur-sm"
                  onClick={() => onFavoriteToggle(currentFeaturedDish.id)}
                >
                  <Heart className={`h-4 w-4 ${currentFeaturedDish.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </Button>

                {/* Slide indicators */}
                {topDishes.length > 1 && (
                  <div className="absolute bottom-4 right-4 flex space-x-1">
                    {topDishes.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentSlide ? 'bg-white w-6' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {currentFeaturedDish.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {currentFeaturedDish.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="font-medium">{currentFeaturedDish.rating}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{currentFeaturedDish.prepTime}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(currentFeaturedDish.price)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <img
                      src={currentFeaturedDish.cookerAvatar}
                      alt={currentFeaturedDish.cookerName}
                      className="w-6 h-6 rounded-full"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAxNUMzMC41MjI5IDE1IDM1IDEwLjUyMjkgMzUgNUMzNSAyLjc5MDg2IDMzLjIwOTEgMSAzMSAxSDIwQzE3LjI5MDkgMSAxNS40NjA5IDIuNzkwODYgMTUgNUMxNSAxMC41MjI5IDE5LjQ3NzEgMTUgMjUgMTVaIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0xMCAzNUMxMCAyNi43MTU3IDE2LjcxNTcgMjAgMjUgMjBDMzMuMjg0MyAyMCA0MCAyNi43MTU3IDQwIDM1VjQ1SDBWMzVaIiBmaWxsPSIjOUI5QkEzIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                    <span className="text-gray-600">por</span>
                    <span className="font-medium text-gray-800">{currentFeaturedDish.cookerName}</span>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-xs">{currentFeaturedDish.cookerRating}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => onDishClick(currentFeaturedDish.id)}
                  >
                    {user ? 'Ver detalles y pedir' : 'Crear cuenta para pedir'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}