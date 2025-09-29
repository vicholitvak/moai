'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  Loader2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import RecommendedPairings from './recommended-pairings';
import { ReviewSystem } from '@/components/reviews/ReviewSystem';
import { DishCustomizationModal } from '@/components/DishCustomizationModal';
import type { CustomizedDishOrder } from '@/types/dishCustomization';

interface DishWithCookDetails extends Dish {
  cookerBio?: string;
  images?: string[];
  distance?: string;
  reviews?: Review[];
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
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

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
          distance: cook?.distance || 'Nearby', // Real distance from cook profile or default
          reviews: reviewsData,
          cookerBio: cookData?.bio || 'Passionate home cook sharing delicious meals'
        };

        setDish(dishWithDetails);
        setCook(cookData);
        setReviews(reviewsData);

        // Si el plato tiene personalización, abrir el modal automáticamente
        if (dishData.customization?.enabled && user) {
          setShowCustomizationModal(true);
        }

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
  }, [resolvedParams.id, user]);

  const handleAddToCart = async () => {
    if (!dish || !user) return;

    // Si el plato tiene personalización habilitada, abrir el modal
    if (dish.customization?.enabled) {
      setShowCustomizationModal(true);
      return;
    }

    // Si no tiene personalización, agregar directo al carrito
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

      toast.success(`Added ${dish.name} to cart!`, {
        description: `Quantity: ${quantity}`,
        action: {
          label: 'View Cart',
          onClick: () => router.push('/cart')
        }
      });

      // Reset quantity after adding to cart
      setQuantity(1);

    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleCustomizedOrderAddToCart = (order: CustomizedDishOrder) => {
    // Agregar orden personalizada al carrito
    const cartItem = {
      dishId: order.dishId,
      name: order.dishName,
      price: order.totalPrice,
      image: dish!.image,
      cookerName: cook?.displayName || dish!.cookerName,
      cookerId: dish!.cookerId,
      cookerAvatar: cook?.avatar || dish!.cookerAvatar,
      quantity: order.quantity,
      prepTime: dish!.prepTime,
      category: dish!.category,
      customization: order.selections,
      specialInstructions: order.specialInstructions
    };

    addToCart(cartItem);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // You would typically save this to backend
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dish details...</p>
        </div>
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🍽️</div>
          <h1 className="text-2xl font-bold text-foreground">
            {error || 'Dish not found'}
          </h1>
          <p className="text-muted-foreground max-w-md">
            {error === 'Dish not found' 
              ? 'The dish you\'re looking for doesn\'t exist or may have been removed.'
              : 'There was an error loading the dish details. Please try again.'
            }
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => router.push('/dishes')}>
              Browse Dishes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="hover:scale-105 transition-transform duration-150"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1" />
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:scale-105 transition-transform duration-150"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/cart')}
              className="relative hover:scale-105 transition-transform duration-150"
            >
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center animate-in zoom-in-50 duration-300">
                  {itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted relative group">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <img 
                src={dish.images?.[selectedImage] || dish.image} 
                alt={dish.name}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  setImageLoading(false);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNzUgMTc1SDMyNVYyMjVIMjc1VjE3NVoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
                }}
              />
              {/* Image overlay with favorite button */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={toggleFavorite}
                  className="backdrop-blur-sm bg-white/80 hover:bg-white/90"
                >
                  <Heart className={`h-4 w-4 transition-colors duration-200 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(dish.images || [dish.image]).map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImage(index);
                    setImageLoading(true);
                  }}
                  className={`aspect-square w-20 rounded-md overflow-hidden border-2 transition-all duration-200 hover:scale-105 flex-shrink-0 ${
                    selectedImage === index 
                      ? 'border-primary shadow-lg' 
                      : 'border-transparent hover:border-primary/50'
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

          {/* Dish Info */}
          <div className="space-y-6">
            <div>
              <div className="mb-2">
                <h1 className="text-3xl font-bold animate-in fade-in-50 slide-in-from-bottom-3 duration-500">{dish.name}</h1>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{dish.rating}</span>
                  <span className="text-muted-foreground">({dish.reviewCount} reviews)</span>
                </div>
                <Badge variant={dish.isAvailable ? 'default' : 'secondary'}>
                  {dish.isAvailable ? 'Available' : 'Sold Out'}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{dish.description}</p>
            </div>

            {/* Cook Info */}
            <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => router.push(`/cooks/${dish.cookerId}`)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-300">
                    <AvatarImage src={cook?.avatar || dish.cookerAvatar} />
                    <AvatarFallback>
                      <ChefHat className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors duration-200">{cook?.displayName || dish.cookerName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{cook?.rating || dish.cookerRating}</span>
                      </div>
                      <span>•</span>
                      <span>{cook?.reviewCount || reviews.length} reviews</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/cooks/${dish.cookerId}`);
                    }}
                    className="opacity-70 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    Ver Perfil
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-3 group-hover:text-foreground/80 transition-colors duration-200">{dish.cookerBio}</p>
              </CardContent>
            </Card>

            {/* Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 hover:scale-105 cursor-default group">
                <MapPin className="h-5 w-5 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                <p className="text-sm font-medium">{dish.distance || '1.2 km'}</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 hover:scale-105 cursor-default group">
                <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                <p className="text-sm font-medium">{dish.prepTime}</p>
                <p className="text-xs text-muted-foreground">Prep Time</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-all duration-200 hover:scale-105 cursor-default group">
                <Award className="h-5 w-5 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                <p className="text-sm font-medium">{dish.category}</p>
                <p className="text-xs text-muted-foreground">Cuisine</p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {dish.tags.map((tag: string, index: number) => (
                  <Badge 
                    key={tag} 
                    variant="outline"
                    className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105 cursor-pointer animate-in fade-in-50 slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Price and Add to Cart */}
            <div className="border-t pt-6">
              {!dish.customization?.enabled && (
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl font-bold text-primary">{formatPrice(dish.price)}</span>
                    <span className="text-muted-foreground ml-2">por porción</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="hover:scale-105 transition-transform duration-150 active:scale-95"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="w-12 h-10 flex items-center justify-center bg-muted rounded-md border">
                      <span className="font-medium text-lg animate-in zoom-in-50 duration-200" key={quantity}>
                        {quantity}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="hover:scale-105 transition-transform duration-150 active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {dish.customization?.enabled && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-primary">Precio base: {formatPrice(dish.price)}</span>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800 font-medium">
                      ⚙️ Este plato es personalizable. El precio final dependerá de tus selecciones.
                    </p>
                  </div>
                </div>
              )}
              <Button 
                className={`w-full relative overflow-hidden transition-all duration-300 ${
                  addToCartSuccess 
                    ? 'bg-green-500 hover:bg-green-600 scale-105' 
                    : ''
                }`} 
                size="lg"
                disabled={!dish.isAvailable || isAddingToCart || !user}
                onClick={handleAddToCart}
              >
                {addToCartSuccess ? (
                  <div className="flex items-center animate-in zoom-in-50 duration-300">
                    <div className="h-5 w-5 mr-2 rounded-full bg-white/20 flex items-center justify-center">
                      ✓
                    </div>
                    Added to Cart!
                  </div>
                ) : isAddingToCart ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Adding to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart className={`h-5 w-5 mr-2 transition-transform duration-200 ${isAddingToCart ? 'scale-110' : ''}`} />
                    {!dish.isAvailable
                      ? 'No Disponible'
                      : !user
                      ? 'Inicia sesión para Agregar'
                      : dish.customization?.enabled
                      ? 'Personalizar Pedido'
                      : `Agregar al Carrito - ${formatPrice(dish.price * quantity)}`
                    }
                  </>
                )}
                
                {/* Ripple effect for click */}
                {isAddingToCart && (
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-lg" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Info Tabs */}
        <div className="mt-12 space-y-8">
          {/* Customization Info (if enabled) */}
          {dish.customization?.enabled && (
            <Card className="border-2 border-atacama-orange/50 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-atacama-orange/10 to-orange-50">
                <CardTitle className="flex items-center gap-2 text-atacama-brown">
                  ⚙️ Plato Personalizable
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Este plato cuenta con un sistema de personalización completo. Podrás elegir tus ingredientes favoritos y crear tu combinación perfecta.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dish.customization.groups.map((group, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                        <div className="w-2 h-2 bg-atacama-orange rounded-full mt-1.5" />
                        <div>
                          <p className="font-medium text-sm">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.options.length} opciones disponibles
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Haz clic en &quot;Personalizar Pedido&quot; para ver todas las opciones y crear tu combinación ideal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ingredients - only show if no customization */}
          {!dish.customization?.enabled && (
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                  </div>
                  Ingredientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {dish.ingredients.map((ingredient: string, index: number) => (
                    <div
                      key={ingredient}
                      className="flex items-center gap-2 p-2 bg-muted rounded hover:bg-muted/70 transition-colors duration-200 animate-in fade-in-50 slide-in-from-left-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nutrition & Allergens - only show if no customization */}
          {!dish.customization?.enabled && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🥗
                    Información Nutricional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dish.nutritionInfo ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors duration-200">
                        <span>Calorías</span>
                        <span className="font-medium px-2 py-1 bg-primary/10 rounded-full text-primary">{dish.nutritionInfo.calories}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors duration-200">
                        <span>Proteína</span>
                        <span className="font-medium px-2 py-1 bg-blue-100 rounded-full text-blue-700">{dish.nutritionInfo.protein}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors duration-200">
                        <span>Carbohidratos</span>
                        <span className="font-medium px-2 py-1 bg-green-100 rounded-full text-green-700">{dish.nutritionInfo.carbs}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors duration-200">
                        <span>Grasas</span>
                        <span className="font-medium px-2 py-1 bg-orange-100 rounded-full text-orange-700">{dish.nutritionInfo.fat}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Información nutricional no disponible</p>
                  )}
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ⚠️
                    Información de Alérgenos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dish.allergens && dish.allergens.length > 0 ? (
                    <div className="space-y-2">
                      {dish.allergens.map((allergen: string, index: number) => (
                        <div
                          key={allergen}
                          className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors duration-200 animate-in fade-in-50 slide-in-from-right-2"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-yellow-800">Contiene {allergen}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-2xl mb-2">✅</div>
                      <p className="text-muted-foreground">Sin información de alérgenos disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reviews Section */}
          <ReviewSystem 
            cookerId={dish.cookerId}
            dishId={dish.id}
            dishName={dish.name}
            onReviewSubmit={() => {
              // Reload reviews after new review is submitted
              fetchDishData();
            }}
          />

          {/* All Cook Menu */}
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Menú Completo de {cook?.displayName || dish.cookerName}</CardTitle>
                  <CardDescription className="mt-1">
                    Explora todos los platos disponibles y agrega más a tu pedido
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/cooks/${dish.cookerId}`)}
                  className="shrink-0"
                >
                  Ver Perfil Completo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RecommendedPairings
                cookId={dish.cookerId}
                onAddToCart={(item) => {
                  addToCart(item);
                  toast.success(`${item.name} agregado al carrito!`, {
                    action: {
                      label: 'Ver Carrito',
                      onClick: () => router.push('/cart')
                    }
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customization Modal */}
      {dish && (
        <DishCustomizationModal
          isOpen={showCustomizationModal}
          onClose={() => setShowCustomizationModal(false)}
          dish={{
            id: dish.id,
            name: dish.name,
            image: dish.image,
            price: dish.price,
            cookerId: dish.cookerId,
            customization: dish.customization
          }}
          onAddToCart={handleCustomizedOrderAddToCart}
          onAddComplementToCart={(item) => {
            addToCart(item);
            toast.success(`${item.name} agregado al carrito!`, {
              action: {
                label: 'Ver Carrito',
                onClick: () => router.push('/cart')
              }
            });
          }}
        />
      )}
    </div>
  );
};

export default DishDetailsPage;
