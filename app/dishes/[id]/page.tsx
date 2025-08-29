'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { DishesService, CooksService, ReviewsService } from '@/lib/firebase/dataService';
import type { Dish, Cook, Review } from '@/lib/firebase/dataService';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Heart,
  ShoppingCart,
  ChefHat,
  Users,
  Award,
  MessageCircle,
  Plus,
  Minus,
  Share2,
  Loader2,
  Check,
  Leaf,
  Flame,
  Shield,
  Zap,
  Phone,
  MessageSquare,
  Truck,
  Calendar,
  DollarSign,
  Eye,
  ThumbsUp,
  Sparkles,
  Crown,
  TrendingUp
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import RecommendedPairings from './recommended-pairings';
import { ReviewSystem } from '@/components/reviews/ReviewSystem';

interface DishWithCookDetails extends Dish {
  cookerBio?: string;
  images?: string[];
  distance?: string;
  reviews?: Review[];
  isNew?: boolean;
  isTrending?: boolean;
  deliveryTime?: string;
  discountPercentage?: number;
}

const DishDetailsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, itemCount } = useCart();
  const resolvedParams = use(params);
  const [dish, setDish] = useState<DishWithCookDetails | null>(null);
  const [cook, setCook] = useState<Cook | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNutrition, setShowNutrition] = useState(false);

  useEffect(() => {
    const fetchDishData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dish data from Firebase
        const dishData = await DishesService.getDishById(resolvedParams.id);

        if (!dishData) {
          setError('Dish not found');
          return;
        }

        // Fetch cook data
        const cookData = await CooksService.getCookById(dishData.cookerId);

        // Fetch reviews for this dish/cook
        const reviewsData = await ReviewsService.getReviewsByCook(dishData.cookerId);

        // Create enhanced dish object with additional properties
        const dishWithDetails: DishWithCookDetails = {
          ...dishData,
          images: [dishData.image, dishData.image, dishData.image], // Use dish image for now
          distance: '1.2 km',
          reviews: reviewsData,
          cookerBio: cookData?.bio || 'Passionate home cook sharing delicious meals',
          isNew: dishData.tags?.includes('nuevo') || false,
          isTrending: Math.random() > 0.7, // Mock trending status
          deliveryTime: cookData?.settings?.selfDelivery ? '15-30 min' : '30-45 min',
          discountPercentage: Math.random() > 0.8 ? Math.floor(Math.random() * 20) + 10 : undefined
        };

        setDish(dishWithDetails);
        setCook(cookData);
        setReviews(reviewsData);

        // Check if dish is in user's favorites
        if (user) {
          try {
            const userFavorites = await DishesService.getUserFavorites(user.uid);
            setIsFavorite(userFavorites.includes(resolvedParams.id));
          } catch (error) {
            console.warn('Could not load user favorites:', error);
            setIsFavorite(false);
          }
        } else {
          setIsFavorite(false);
        }

      } catch (error) {
        console.error('Error fetching dish data:', error);
        setError('Error loading dish details');
      } finally {
        setLoading(false);
      }
    };

    fetchDishData();
  }, [resolvedParams.id]);

  const handleAddToCart = async () => {
    if (!dish || !user) return;

    setIsAddingToCart(true);

    try {
      const cartItem = {
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        cookerName: cook?.displayName || dish.cookerName,
        cookerId: dish.cookerId,
        cookerAvatar: cook?.avatar || dish.cookerAvatar,
        quantity,
        prepTime: dish.prepTime,
        category: dish.category
      };

      addToCart(cartItem);

      // Show success animation
      setAddToCartSuccess(true);
      setTimeout(() => setAddToCartSuccess(false), 2000);

      toast.success(`¡${dish.name} agregado al carrito!`, {
        description: `Cantidad: ${quantity} • Total: ${formatPrice(dish.price * quantity)}`,
        action: {
          label: 'Ver Carrito',
          onClick: () => router.push('/cart')
        }
      });

      // Reset quantity after adding to cart
      setQuantity(1);

    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error al agregar al carrito');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removido de favoritos' : 'Agregado a favoritos');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: dish?.name,
          text: `¡Mira este delicioso plato: ${dish?.name}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  // Get dietary badges
  const getDietaryBadges = () => {
    const badges = [];
    if (dish?.tags?.includes('vegano') || dish?.tags?.includes('vegan')) {
      badges.push({ text: 'Vegano', icon: Leaf, color: 'bg-emerald-500' });
    }
    if (dish?.tags?.includes('saludable') || dish?.tags?.includes('healthy')) {
      badges.push({ text: 'Saludable', icon: Sparkles, color: 'bg-blue-500' });
    }
    if (dish?.tags?.includes('sin gluten') || dish?.tags?.includes('gluten-free')) {
      badges.push({ text: 'Sin Gluten', icon: Shield, color: 'bg-purple-500' });
    }
    if (dish?.tags?.includes('picante') || dish?.tags?.includes('spicy')) {
      badges.push({ text: 'Picante', icon: Flame, color: 'bg-red-500' });
    }
    return badges;
  };

  const dietaryBadges = getDietaryBadges();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-slate-900" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Cargando detalles del plato...</p>
        </div>
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="text-8xl animate-bounce">🍽️</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {error || 'Plato no encontrado'}
            </h1>
            <p className="text-slate-600 leading-relaxed">
              {error === 'Dish not found'
                ? 'El plato que buscas no existe o puede haber sido removido.'
                : 'Hubo un error cargando los detalles del plato. Por favor intenta de nuevo.'
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.back()} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver Atrás
            </Button>
            <Button onClick={() => router.push('/dishes')} className="gap-2">
              <Eye className="h-4 w-4" />
              Explorar Platos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const originalPrice = dish.discountPercentage ? Math.round(dish.price / (1 - dish.discountPercentage / 100)) : dish.price;
  const savings = originalPrice - dish.price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="hover:scale-105 transition-all duration-200 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>

              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                <span>Platos</span>
                <span>/</span>
                <span className="text-slate-900 font-medium truncate max-w-48">{dish.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="hover:scale-105 transition-all duration-200 hover:bg-slate-100"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/cart')}
                className="relative hover:scale-105 transition-all duration-200 hover:bg-slate-100"
              >
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-slate-900 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center animate-in zoom-in-50 duration-300">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Enhanced Image Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-xl group">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-900 mx-auto" />
                    <p className="text-sm text-slate-600">Cargando imagen...</p>
                  </div>
                </div>
              )}

              <img
                src={dish.images?.[selectedImage] || dish.image}
                alt={dish.name}
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  setImageLoading(false);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNzUgMTc1SDMyNVYyMjVIMjc1VjE3NVoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
                }}
              />

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleFavorite}
                    className={`backdrop-blur-sm bg-white/90 hover:bg-white transition-all duration-200 hover:scale-110 ${isFavorite ? 'text-red-500' : ''}`}
                  >
                    <Heart className={`h-4 w-4 transition-all duration-200 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">Vista previa</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{dish.rating}</span>
                      <span className="text-yellow-200">({dish.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Badges */}
              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                {dish.isNew && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    Nuevo
                  </Badge>
                )}
                {dish.isTrending && (
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Tendencia
                  </Badge>
                )}
                {dish.discountPercentage && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg animate-bounce">
                    <Crown className="h-3 w-3 mr-1" />
                    -{dish.discountPercentage}% OFF
                  </Badge>
                )}
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex gap-3 overflow-x-auto pb-2 mt-4">
                {(dish.images || [dish.image]).map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index);
                      setImageLoading(true);
                    }}
                    className={`aspect-square w-20 rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 flex-shrink-0 ${
                      selectedImage === index
                        ? 'border-slate-900 shadow-lg ring-2 ring-slate-900/20'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${dish.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Dish Information */}
          <div className="space-y-8">
            {/* Title and Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-slate-900 leading-tight">{dish.name}</h1>
                <p className="text-lg text-slate-600 leading-relaxed">{dish.description}</p>
              </div>

              {/* Rating and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-full">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-slate-900">{dish.rating}</span>
                    <span className="text-slate-600">({dish.reviewCount} reseñas)</span>
                  </div>

                  <Badge
                    variant={dish.isAvailable ? 'default' : 'secondary'}
                    className={`px-3 py-1 ${dish.isAvailable ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-500'}`}
                  >
                    {dish.isAvailable ? '✓ Disponible' : '✗ Agotado'}
                  </Badge>
                </div>

                {/* Dietary Badges */}
                {dietaryBadges.length > 0 && (
                  <div className="flex gap-2">
                    {dietaryBadges.slice(0, 2).map((badge, index) => {
                      const Icon = badge.icon;
                      return (
                        <Badge key={index} className={`${badge.color} text-white text-xs px-2 py-1`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {badge.text}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Cook Information */}
            <Card className="hover:shadow-xl transition-all duration-300 group cursor-pointer border-0 shadow-lg bg-gradient-to-r from-white to-slate-50" onClick={() => router.push(`/cooks/${dish.cookerId}`)}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                    <AvatarImage src={cook?.avatar || dish.cookerAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white text-lg">
                      <ChefHat className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                        {cook?.displayName || dish.cookerName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{cook?.rating || dish.cookerRating}</span>
                        </div>
                        <span>•</span>
                        <span>{cook?.reviewCount || reviews.length} reseñas</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{dish.distance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{dish.deliveryTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/cooks/${dish.cookerId}`);
                      }}
                      className="opacity-70 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
                    >
                      Ver Perfil
                    </Button>

                    {cook?.settings?.selfDelivery && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                        <Truck className="h-3 w-3 mr-1" />
                        Entrega Directa
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 mt-4 leading-relaxed group-hover:text-slate-700 transition-colors">
                  {dish.cookerBio}
                </p>
              </CardContent>
            </Card>

            {/* Enhanced Details Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-105 group">
                <MapPin className="h-6 w-6 mx-auto mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-slate-900">{dish.distance}</p>
                <p className="text-xs text-slate-600">Distancia</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-105 group">
                <Clock className="h-6 w-6 mx-auto mb-2 text-green-600 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-slate-900">{dish.prepTime}</p>
                <p className="text-xs text-slate-600">Tiempo Prep.</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-105 group">
                <Award className="h-6 w-6 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-slate-900">{dish.category}</p>
                <p className="text-xs text-slate-600">Categoría</p>
              </div>
            </div>

            {/* Enhanced Tags */}
            {dish.tags && dish.tags.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Características</h3>
                <div className="flex flex-wrap gap-2">
                  {dish.tags.map((tag: string, index: number) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="hover:bg-slate-900 hover:text-white transition-all duration-200 hover:scale-105 cursor-pointer border-slate-200 hover:border-slate-900"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Price and Add to Cart */}
            <div className="border-t border-slate-200 pt-8 space-y-6">
              {/* Price Display */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {dish.discountPercentage ? (
                    <div className="space-y-1">
                      <div className="text-sm text-slate-500 line-through">
                        {formatPrice(originalPrice)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-bold text-slate-900">{formatPrice(dish.price)}</span>
                        <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
                          -{dish.discountPercentage}% OFF
                        </Badge>
                      </div>
                      <div className="text-sm text-emerald-600 font-medium">
                        Ahorras {formatPrice(savings)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold text-slate-900">{formatPrice(dish.price)}</span>
                      <span className="text-slate-600 ml-2">por porción</span>
                    </div>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="hover:scale-105 transition-all duration-200 h-10 w-10 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="w-12 h-10 flex items-center justify-center bg-white rounded-lg border-2 border-slate-200">
                    <span className="font-bold text-lg text-slate-900 animate-in zoom-in-50 duration-200" key={quantity}>
                      {quantity}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="hover:scale-105 transition-all duration-200 h-10 w-10 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Enhanced Add to Cart Button */}
              <Button
                className={`w-full relative overflow-hidden transition-all duration-300 font-semibold text-lg py-6 rounded-xl ${
                  addToCartSuccess
                    ? 'bg-emerald-500 hover:bg-emerald-600 scale-105 shadow-lg shadow-emerald-200'
                    : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 shadow-lg hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-0.5'
                }`}
                size="lg"
                disabled={!dish.isAvailable || isAddingToCart || !user}
                onClick={handleAddToCart}
              >
                {addToCartSuccess ? (
                  <div className="flex items-center animate-in zoom-in-50 duration-300">
                    <Check className="h-6 w-6 mr-3" />
                    ¡Agregado al Carrito!
                  </div>
                ) : isAddingToCart ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Agregando al Carrito...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-6 w-6 mr-3" />
                    {!dish.isAvailable
                      ? 'Agotado'
                      : !user
                      ? 'Inicia Sesión para Pedir'
                      : `Agregar al Carrito • ${formatPrice(dish.price * quantity)}`
                    }
                  </>
                )}

                {/* Ripple effect */}
                {isAddingToCart && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl" />
                )}
              </Button>

              {/* Additional Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 hover:bg-slate-50 transition-all duration-200"
                  onClick={() => router.push(`/cooks/${dish.cookerId}`)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Contactar Cocinero
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 gap-2 hover:bg-slate-50 transition-all duration-200"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Additional Information */}
        <div className="mt-16">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Información
              </TabsTrigger>
              <TabsTrigger value="ingredients" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Ingredientes
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Nutrición
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Reseñas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-slate-600" />
                      Sobre este Plato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">{dish.description}</p>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-slate-600">Categoría</p>
                        <p className="font-medium">{dish.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Tiempo de Preparación</p>
                        <p className="font-medium">{dish.prepTime}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-slate-600" />
                      Información de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-700">Tiempo Estimado</span>
                      <span className="font-medium text-slate-900">{dish.deliveryTime}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-700">Distancia</span>
                      <span className="font-medium text-slate-900">{dish.distance}</span>
                    </div>
                    {cook?.settings?.selfDelivery && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-800 font-medium">Entrega directa por el cocinero</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ingredients" className="mt-8">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-slate-600" />
                    Ingredientes Frescos
                  </CardTitle>
                  <CardDescription>
                    Todos los ingredientes son frescos y de la más alta calidad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dish.ingredients.map((ingredient: string, index: number) => (
                      <div
                        key={ingredient}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200 animate-in fade-in-50 slide-in-from-left-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse" />
                        <span className="text-slate-700">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nutrition" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-slate-600" />
                      Información Nutricional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dish.nutritionInfo ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-slate-50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900">{dish.nutritionInfo.calories}</div>
                            <div className="text-sm text-slate-600">Calorías</div>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-700">{dish.nutritionInfo.protein}</div>
                            <div className="text-sm text-blue-600">Proteína</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-700">{dish.nutritionInfo.carbs}</div>
                            <div className="text-sm text-green-600">Carbohidratos</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-700">{dish.nutritionInfo.fat}</div>
                            <div className="text-sm text-orange-600">Grasa</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Sparkles className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600">Información nutricional no disponible</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-slate-600" />
                      Información de Alérgenos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dish.allergens && dish.allergens.length > 0 ? (
                      <div className="space-y-3">
                        {dish.allergens.map((allergen: string, index: number) => (
                          <div
                            key={allergen}
                            className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-in fade-in-50 slide-in-from-right-2"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                            <span className="text-yellow-800 font-medium">Contiene {allergen}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Check className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                        <p className="text-emerald-700 font-medium">Sin alérgenos conocidos</p>
                        <p className="text-slate-600 text-sm">Este plato no contiene alérgenos comunes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8">
              <ReviewSystem
                cookerId={dish.cookerId}
                dishId={dish.id}
                dishName={dish.name}
                onReviewSubmit={() => {
                  // Reload reviews after new review is submitted
                  window.location.reload();
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Recommended Pairings */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Complementa tu Pedido</h2>
            <p className="text-slate-600">Descubre otros deliciosos platos de este cocinero</p>
          </div>

          <RecommendedPairings
            cookId={dish.cookerId}
            onAddToCart={(item) => {
              addToCart(item);
              toast.success(`¡${item.name} agregado al carrito!`, {
                action: {
                  label: 'Ver Carrito',
                  onClick: () => router.push('/cart')
                }
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DishDetailsPage;
