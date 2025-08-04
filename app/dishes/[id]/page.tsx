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
  Loader2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import RecommendedPairings from './recommended-pairings';

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
        // Check if dish is in user's favorites
        if (user) {
          try {
            const userFavorites = await DishesService.getUserFavorites(user.uid);
            setIsFavorite(userFavorites.includes(dishId));
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
                    View Profile
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold text-primary">{formatPrice(dish.price)}</span>
                  <span className="text-muted-foreground ml-2">per serving</span>
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
                      ? 'Sold Out'
                      : !user
                      ? 'Login to Add to Cart'
                      : `Add to Cart - ${formatPrice(dish.price * quantity)}`
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
          {/* Ingredients */}
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                </div>
                Ingredients
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

          {/* Nutrition & Allergens */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🥗
                  Nutrition Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dish.nutritionInfo ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors duration-200">
                      <span>Calories</span>
                      <span className="font-medium px-2 py-1 bg-primary/10 rounded-full text-primary">{dish.nutritionInfo.calories}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors duration-200">
                      <span>Protein</span>
                      <span className="font-medium px-2 py-1 bg-blue-100 rounded-full text-blue-700">{dish.nutritionInfo.protein}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors duration-200">
                      <span>Carbohydrates</span>
                      <span className="font-medium px-2 py-1 bg-green-100 rounded-full text-green-700">{dish.nutritionInfo.carbs}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition-colors duration-200">
                      <span>Fat</span>
                      <span className="font-medium px-2 py-1 bg-orange-100 rounded-full text-orange-700">{dish.nutritionInfo.fat}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nutrition information not available</p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚠️
                  Allergen Information
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
                        <span className="text-sm font-medium text-yellow-800">Contains {allergen}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-2xl mb-2">✅</div>
                    <p className="text-muted-foreground">No allergen information available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reviews */}
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Reviews ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: Review, index: number) => (
                    <div 
                      key={review.id} 
                      className="border-b pb-4 last:border-b-0 hover:bg-muted/30 -mx-4 px-4 py-2 rounded transition-colors duration-200 animate-in fade-in-50 slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
                          <AvatarImage src={review.customerAvatar} />
                          <AvatarFallback>
                            <Users className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{review.customerName}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 transition-colors duration-200 ${
                                    i < review.rating 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {review.createdAt.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No reviews yet. Be the first to review this dish!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Pairings */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Complementa tu Pedido</h3>
            <RecommendedPairings 
              cookId={dish.cookerId} 
              onAddToCart={(item) => {
                addToCart(item);
                toast.success(`Added ${item.name} to cart!`, {
                  action: {
                    label: 'View Cart',
                    onClick: () => router.push('/cart')
                  }
                });
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishDetailsPage;
