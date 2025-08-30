'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  ChevronLeft, 
  ChevronRight,
  Pizza,
  Coffee,
  Salad,
  Soup,
  Cookie,
  Fish,
  Beef,
  Apple,
  Wine,
  IceCream,
  Sandwich,
  Cake,
  Utensils
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: any;
  gradient: string;
  description: string;
  count: number;
  isPopular?: boolean;
}

interface CategoriesCarouselProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  dishCounts: { [key: string]: number };
}

const categoryIcons: { [key: string]: any } = {
  'All': Utensils,
  'Italiana': Pizza,
  'Mexicana': Soup,
  'Japonesa': Fish,
  'India': Soup,
  'Americana': Sandwich,
  'Francesa': Cake,
  'China': Soup,
  'Tailandesa': Soup,
  'Mediterránea': Salad,
  'Vegana': Apple,
  'Saludable': Salad,
  'Acompañamientos': Cookie,
  'Para Tomar': Coffee,
  'Postres': IceCream,
  'Desayuno': Coffee,
  'Almuerzo': Beef,
  'Cena': Wine
};

const categoryGradients: { [key: string]: string } = {
  'All': 'from-purple-500 to-pink-500',
  'Italiana': 'from-green-500 to-red-500',
  'Mexicana': 'from-orange-500 to-red-500',
  'Japonesa': 'from-pink-500 to-purple-500',
  'India': 'from-yellow-500 to-orange-500',
  'Americana': 'from-blue-500 to-red-500',
  'Francesa': 'from-blue-500 to-purple-500',
  'China': 'from-red-500 to-yellow-500',
  'Tailandesa': 'from-green-500 to-teal-500',
  'Mediterránea': 'from-blue-500 to-green-500',
  'Vegana': 'from-green-500 to-lime-500',
  'Saludable': 'from-green-400 to-blue-400',
  'Acompañamientos': 'from-orange-400 to-yellow-400',
  'Para Tomar': 'from-purple-400 to-pink-400',
  'Postres': 'from-pink-400 to-purple-400',
  'Desayuno': 'from-orange-400 to-yellow-400',
  'Almuerzo': 'from-blue-400 to-green-400',
  'Cena': 'from-purple-400 to-indigo-400'
};

const categoryDescriptions: { [key: string]: string } = {
  'All': 'Todos los platos disponibles',
  'Italiana': 'Pasta, pizza y sabores auténticos',
  'Mexicana': 'Tacos, burritos y comida picante',
  'Japonesa': 'Sushi, ramen y cocina oriental',
  'India': 'Curry, especias y sabores exóticos',
  'Americana': 'Hamburguesas, wings y clásicos',
  'Francesa': 'Elegancia y técnica culinaria',
  'China': 'Wok, dim sum y tradición',
  'Tailandesa': 'Pad thai y sabores asiáticos',
  'Mediterránea': 'Aceite de oliva y pescado fresco',
  'Vegana': 'Sin productos de origen animal',
  'Saludable': 'Nutritivo y delicioso',
  'Acompañamientos': 'Guarniciones perfectas',
  'Para Tomar': 'Bebidas y refrescos'
};

export default function CategoriesCarousel({
  selectedCategory,
  onCategorySelect,
  dishCounts
}: CategoriesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  // Create categories with dynamic data
  const categories: Category[] = Object.keys(dishCounts).map(categoryName => {
    const Icon = categoryIcons[categoryName] || Utensils;
    const gradient = categoryGradients[categoryName] || 'from-gray-400 to-gray-600';
    const description = categoryDescriptions[categoryName] || 'Deliciosos platos';
    const count = dishCounts[categoryName] || 0;
    const isPopular = count > 10; // Mark as popular if more than 10 dishes

    return {
      id: categoryName,
      name: categoryName,
      icon: Icon,
      gradient,
      description,
      count,
      isPopular
    };
  });

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
    return undefined;
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (isScrolling) return;
    setIsScrolling(true);

    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      const targetScroll = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });

      setTimeout(() => {
        setIsScrolling(false);
        updateScrollButtons();
      }, 300);
    }
  };

  return (
    <div className="relative mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Explora por Categorías
          </h2>
          <p className="text-gray-600">
            Descubre sabores de todo el mundo 🌍
          </p>
        </div>
        
        {/* Scroll controls */}
        <div className="hidden md:flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft || isScrolling}
            className="h-10 w-10 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            disabled={!canScrollRight || isScrolling}
            className="h-10 w-10 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Categories Container */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Card
                key={category.id}
                className={`flex-shrink-0 w-48 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  isSelected 
                    ? 'ring-2 ring-purple-500 shadow-xl scale-105' 
                    : 'shadow-md hover:shadow-lg'
                }`}
                onClick={() => onCategorySelect(category.id)}
              >
                <CardContent className="p-0">
                  {/* Icon and gradient header */}
                  <div className={`h-24 bg-gradient-to-br ${category.gradient} relative overflow-hidden flex items-center justify-center`}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 left-0 w-16 h-16 bg-white/20 rounded-full -translate-x-8 -translate-y-8"></div>
                      <div className="absolute bottom-0 right-0 w-12 h-12 bg-white/20 rounded-full translate-x-6 translate-y-6"></div>
                    </div>
                    
                    {/* Icon */}
                    <div className="relative z-10">
                      <Icon className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                    
                    {/* Popular badge */}
                    {category.isPopular && (
                      <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs border-0">
                        Popular
                      </Badge>
                    )}
                    
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className={`font-semibold mb-1 ${isSelected ? 'text-purple-600' : 'text-gray-900'}`}>
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {category.count} platos
                      </Badge>
                      {isSelected && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Add padding at the end */}
          <div className="flex-shrink-0 w-4"></div>
        </div>

        {/* Left gradient fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
        )}
        
        {/* Right gradient fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
        )}
      </div>

      {/* Mobile scroll hint */}
      <div className="md:hidden text-center mt-4">
        <p className="text-sm text-gray-500">
          👈 Desliza para ver más categorías 👉
        </p>
      </div>

      {/* Selected category info */}
      {selectedCategory !== 'All' && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${categoryGradients[selectedCategory] || 'from-gray-400 to-gray-600'} rounded-full flex items-center justify-center`}>
              {(() => {
                const Icon = categoryIcons[selectedCategory] || Utensils;
                return <Icon className="h-5 w-5 text-white" />;
              })()}
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">
                Explorando: {selectedCategory}
              </h3>
              <p className="text-sm text-purple-700">
                {categoryDescriptions[selectedCategory] || 'Deliciosos platos'} • {dishCounts[selectedCategory] || 0} opciones disponibles
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}