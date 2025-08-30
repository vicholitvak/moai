'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { toast } from 'sonner';
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
  Share2,
  TrendingUp,
  Badge as BadgeIcon,
  Utensils,
  Globe,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { formatPrice } from '@/lib/utils';
import { CooksService, DishesService, ReviewsService } from '@/lib/firebase/dataService';
import type { Cook, Dish, Review } from '@/lib/firebase/dataService';
import { ReviewSystem } from '@/components/reviews/ReviewSystem';
import { UserProfileService } from '@/lib/services/userProfileService';
import { ChatService } from '@/lib/services/chatService';

interface CookProfile extends Omit<Cook, 'cookingStyle' | 'favoriteIngredients' | 'achievements'> {
  dishes: Dish[];
  reviews: Review[];
  cookingStyle?: string;
  achievements?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  favoriteIngredients?: string[];
}

const CookProfilePage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [cook, setCook] = useState<CookProfile | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cookId, setCookId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dishes' | 'about' | 'reviews'>('dishes');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'main' | 'drinks' | 'sides'>('all');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setCookId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!cookId) return;
    
    const fetchCookData = async () => {
      try {
        setLoading(true);
        
        // Fetch cook profile
        const cookData = await CooksService.getCookById(cookId);
        if (!cookData) {
          setLoading(false);
          return;
        }
        
        // Fetch cook's dishes
        const cookDishes = await DishesService.getDishesByCookId(cookId);
        
        // Fetch cook's reviews (if ReviewsService exists)
        let cookReviews: Review[] = [];
        try {
          cookReviews = await ReviewsService.getReviewsByCook(cookId);
        } catch (error) {
          console.warn('Reviews service not available:', error);
          cookReviews = [];
        }
        
        // Combine data
        const fullCookProfile: CookProfile = {
          ...cookData,
          dishes: cookDishes,
          reviews: cookReviews,
          achievements: [
            { title: 'Top Rated Cook', description: `Maintained ${cookData.rating}+ rating`, icon: '🏆' },
            { title: 'Satisfied Customers', description: `Served ${cookData.totalOrders ?? 0} customers`, icon: '👥' },
            { title: 'Verified Chef', description: 'Professional cooking certification', icon: '✓' }
          ],
          favoriteIngredients: cookData.specialties ?? [],
          cookingStyle: cookData.bio?.split('.')[0] ?? 'Traditional cooking'
        };
        
        setCook(fullCookProfile);
        setDishes(cookDishes);
        
      } catch (error) {
        console.error('Error fetching cook data:', error);
        toast.error('Failed to load cook profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCookData();
  }, [cookId]);

  // Check follow status when user and cookId are available
  useEffect(() => {
    if (!user || !cookId) return;
    
    const checkFollowStatus = async () => {
      try {
        const following = await UserProfileService.isFollowing(user.uid, cookId);
        setIsFollowing(following);
        
        const counts = await UserProfileService.getFollowCounts(cookId);
        setFollowCounts(counts);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    
    checkFollowStatus();
  }, [user, cookId]);


  // Filter dishes by category
  const getFilteredItems = () => {
    if (!dishes.length) return [];
    
    if (selectedCategory === 'all') return dishes;
    if (selectedCategory === 'main') return dishes.filter(dish => dish.category === 'main' || dish.category === 'Main Dish');
    if (selectedCategory === 'drinks') return dishes.filter(dish => dish.category === 'drink' || dish.category === 'Drink');
    if (selectedCategory === 'sides') return dishes.filter(dish => dish.category === 'side' || dish.category === 'Side');
    return dishes;
  };
  
  const getAllItems = () => dishes;

  const handleFollow = async () => {
    if (followLoading || !user) return;
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow logic
        await UserProfileService.unfollowUser(user.uid, cookId);
        toast.success('Unfollowed the cook');
      } else {
        // Follow logic
        await UserProfileService.followUser(user.uid, cookId);
        toast.success('Followed the cook');
      }
      
      // Update local state
      setIsFollowing(!isFollowing);
      
      // Update follow counts
      const counts = await UserProfileService.getFollowCounts(cookId);
      setFollowCounts(counts);
      
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleContact = async () => {
    if (contactLoading || !user) return;
    setContactLoading(true);
    
    try {
      // Create or get direct chat room with the cook
      const roomId = await ChatService.getOrCreateDirectChatRoom(user.uid, cookId);
      
      if (roomId) {
        // Navigate to chat page with the room ID
        router.push(`/chat?roomId=${roomId}`);
        toast.success('Chat initiated with the cook');
      } else {
        toast.error('Failed to create chat room');
      }
    } catch (error) {
      console.error('Error initiating chat:', error);
      toast.error('Failed to initiate chat');
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cook profile...</p>
        </div>
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cook Not Found</h2>
          <p className="text-muted-foreground mb-4">The cook you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button onClick={() => router.push('/dishes')}>Browse Dishes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/login')}
                className="text-muted-foreground hover:text-destructive"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image & Profile Header */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-orange-400 to-red-500 relative overflow-hidden">
          {cook.coverImage && cook.coverImage.trim() !== '' && (
            <Image 
              src={cook.coverImage} 
              alt={`${cook.name} kitchen`}
              fill
              className="object-cover opacity-80"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        <div className="container mx-auto px-4">
          <div className="relative -mt-16 pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={cook.avatar && cook.avatar.trim() !== '' ? cook.avatar : undefined} />
                <AvatarFallback className="text-2xl">
                  <ChefHat className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 bg-background/95 backdrop-blur rounded-lg p-6 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{cook.name}</h1>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{cook.rating}</span>
                        <span className="text-muted-foreground">({cook.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{cook.location?.address?.fullAddress ?? 'Ubicación no disponible'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {cook.certifications.map((cert: string) => (
                        <Badge key={cert} variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      className="w-full md:w-auto"
                      onClick={handleContact}
                      disabled={contactLoading}
                    >
                      {contactLoading ? 'Connecting...' : <><MessageCircle className="h-4 w-4 mr-2" /> Contact Cook</>}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full md:w-auto"
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      {followLoading ? (isFollowing ? 'Unfollowing...' : 'Following...') : <><Heart className="h-4 w-4 mr-2" /> {isFollowing ? 'Unfollow' : 'Follow'}</>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{cook.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{cook.yearsExperience}</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{dishes.length}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{cook.deliveryRadius}</div>
              <div className="text-sm text-muted-foreground">Delivery Radius</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'dishes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('dishes')}
          >
            <Utensils className="h-4 w-4 mr-2" />
            Menu ({getAllItems().length})
          </Button>
          <Button
            variant={activeTab === 'about' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('about')}
          >
            <Users className="h-4 w-4 mr-2" />
            About
          </Button>
          <Button
            variant={activeTab === 'reviews' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('reviews')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Reviews ({cook.reviewCount})
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dishes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Menu Items</h2>
              <div className="text-sm text-muted-foreground">
                {getFilteredItems().filter((item: Dish) => item.isAvailable).length} of {getFilteredItems().length} available
              </div>
            </div>
            
            {/* Category Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Items ({getAllItems().length})
              </Button>
              <Button
                variant={selectedCategory === 'main' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('main')}
              >
                Main Dishes ({cook.dishes.length})
              </Button>
              <Button
                variant={selectedCategory === 'drinks' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('drinks')}
              >
                Drinks ({(cook as any).drinks?.length ?? 0})
              </Button>
              <Button
                variant={selectedCategory === 'sides' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('sides')}
              >
                Sides ({(cook as any).sides?.length ?? 0})
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredItems().map((item: Dish) => (
                <Card key={item.id} className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${!item.isAvailable ? 'opacity-60' : ''}`}
                      onClick={() => {
                        if (item.category === 'Main Dish') {
                          router.push(`/dishes/${item.id}`);
                        }
                      }}>
                  <div className="aspect-[4/3] relative">
                    <Image 
                      src={item.image} 
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+';
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                        {item.isAvailable ? 'Available' : 'Sold Out'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                      <div className="text-right">
                        <span className="text-xl font-bold text-primary">{formatPrice(item.price)}</span>
                        {(item as any).size && (
                          <div className="text-xs text-muted-foreground">{(item as any).size}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.prepTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{item.rating} ({item.reviewCount})</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      disabled={!item.isAvailable}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({
                          dishId: item.id,
                          name: item.name,
                          price: item.price,
                          quantity: 1,
                          cookerName: cook.displayName,
                          cookerId: cook.id,
                          image: item.image ?? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiM5QjlCQTMiLz4KPC9zdmc+',
                          prepTime: item.prepTime ?? '30 min'
                        } as any);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.isAvailable ? 'Add to Cart' : 'Sold Out'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-8">
            {/* Biography */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  About {cook.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{cook.bio}</p>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">My Story</h4>
                  <p className="text-muted-foreground leading-relaxed">{cook.story}</p>
                </div>
              </CardContent>
            </Card>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Specialties */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Specialties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cook.specialties.map((specialty: string) => (
                      <div key={specialty} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <BadgeIcon className="h-4 w-4 text-primary" />
                        <span>{specialty}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="font-medium">{cook.joinedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cooking Style</span>
                    <span className="font-medium">{cook.cookingStyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Languages</span>
                    <span className="font-medium">{cook.languages.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Area</span>
                    <span className="font-medium">{cook.deliveryRadius} radius</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {(cook.achievements ?? []).map((achievement: { title: string; description: string; icon: string }, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Favorite Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Favorite Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cook.favoriteIngredients?.map((ingredient: string) => (
                    <Badge key={ingredient} variant="outline">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'reviews' && (
          <ReviewSystem 
            cookerId={cookId}
            onReviewSubmit={() => {
              // Reload cook data to update ratings
              const fetchCookData = async () => {
                try {
                  const cookData = await CooksService.getCookById(cookId);
                  if (cookData) {
                    const cookDishes = await DishesService.getDishesByCookId(cookId);
                    const cookReviews = await ReviewsService.getReviewsByCook(cookId);
                    setCook({
                      ...cookData,
                      dishes: cookDishes,
                      reviews: cookReviews,
                      achievements: cook?.achievements ?? [],
                      favoriteIngredients: cook?.favoriteIngredients ?? [],
                      cookingStyle: cook?.cookingStyle ?? ''
                    });
                  }
                } catch (error) {
                  console.error('Error reloading cook data:', error);
                }
              };
              fetchCookData();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CookProfilePage;
