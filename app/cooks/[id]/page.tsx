'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Badge as BadgeIcon,
  Utensils,
  Globe,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { formatPrice } from '@/lib/utils';

// Mock data for cook profiles - replace with real data from your backend
const mockCookProfiles = {
  'maria-rossi': {
    id: 'maria-rossi',
    name: 'Maria Rossi',
    avatar: '/api/placeholder/200/200',
    coverImage: '/api/placeholder/800/300',
    rating: 4.8,
    reviewCount: 234,
    totalOrders: 1247,
    yearsExperience: 20,
    joinedDate: 'March 2023',
    location: 'Little Italy, NYC',
    deliveryRadius: '5 km',
    bio: 'Born and raised in Rome, I moved to New York 25 years ago with my grandmother\'s recipes and a passion for authentic Italian cuisine. I specialize in traditional pasta dishes, homemade sauces, and classic Italian desserts. Every dish I prepare is made with love and the finest imported ingredients from Italy.',
    story: 'My culinary journey began in my nonna\'s kitchen in Trastevere, Rome, where I learned the secrets of authentic Italian cooking. At age 8, I was already rolling pasta by hand and stirring the perfect ragù. When I moved to New York, I brought these treasured family recipes with me. For years, I cooked only for my family and friends, but they convinced me to share my passion with the community. Now, through Moai, I can bring the taste of authentic Italy to your table.',
    specialties: ['Traditional Italian', 'Handmade Pasta', 'Authentic Sauces', 'Italian Desserts'],
    certifications: ['Certified Italian Chef', 'Food Safety Certified', 'Top Rated Cook'],
    languages: ['Italian (Native)', 'English (Fluent)'],
    cookingStyle: 'Traditional Italian with modern presentation',
    favoriteIngredients: ['San Marzano Tomatoes', 'Parmigiano-Reggiano', 'Fresh Basil', 'Extra Virgin Olive Oil'],
    achievements: [
      { title: 'Top Rated Cook 2024', description: 'Maintained 4.8+ rating for 12 months', icon: '🏆' },
      { title: '1000+ Happy Customers', description: 'Served over 1000 satisfied customers', icon: '👥' },
      { title: 'Authentic Italian Badge', description: 'Verified traditional Italian recipes', icon: '🇮🇹' },
      { title: 'Fast Delivery Champion', description: 'Average delivery time under 30 minutes', icon: '⚡' }
    ],
    dishes: [
      {
        id: '1',
        name: 'Spaghetti Carbonara',
        description: 'Authentic Roman carbonara with eggs, pecorino, and guanciale',
        price: 12500,
        image: '/api/placeholder/300/200',
        rating: 4.9,
        reviewCount: 127,
        prepTime: '25 mins',
        isAvailable: true,
        category: 'Main Dish'
      },
      {
        id: '7',
        name: 'Homemade Lasagna',
        description: 'Traditional layered pasta with meat sauce, béchamel, and mozzarella',
        price: 18500,
        image: '/api/placeholder/300/200',
        rating: 4.8,
        reviewCount: 89,
        prepTime: '45 mins',
        isAvailable: true,
        category: 'Main Dish'
      },
      {
        id: '8',
        name: 'Tiramisu',
        description: 'Classic Italian dessert with mascarpone, coffee, and ladyfingers',
        price: 8500,
        image: '/api/placeholder/300/200',
        rating: 4.9,
        reviewCount: 156,
        prepTime: '20 mins',
        isAvailable: true,
        category: 'Dessert'
      },
      {
        id: '9',
        name: 'Risotto ai Funghi',
        description: 'Creamy mushroom risotto with porcini and Parmigiano-Reggiano',
        price: 15500,
        image: '/api/placeholder/300/200',
        rating: 4.7,
        reviewCount: 73,
        prepTime: '35 mins',
        isAvailable: false,
        category: 'Main Dish'
      }
    ],
    drinks: [
      {
        id: 'd1',
        name: 'Italian Sparkling Water',
        description: 'San Pellegrino sparkling mineral water',
        price: 2500,
        image: '/api/placeholder/300/200',
        rating: 4.5,
        reviewCount: 45,
        prepTime: '0 mins',
        isAvailable: true,
        category: 'Drink',
        size: '500ml'
      },
      {
        id: 'd2',
        name: 'Homemade Limoncello',
        description: 'Traditional Italian lemon liqueur made with Amalfi lemons',
        price: 8500,
        image: '/api/placeholder/300/200',
        rating: 4.8,
        reviewCount: 67,
        prepTime: '2 mins',
        isAvailable: true,
        category: 'Drink',
        size: '50ml'
      },
      {
        id: 'd3',
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed Italian blood orange juice',
        price: 4500,
        image: '/api/placeholder/300/200',
        rating: 4.6,
        reviewCount: 32,
        prepTime: '3 mins',
        isAvailable: true,
        category: 'Drink',
        size: '250ml'
      },
      {
        id: 'd4',
        name: 'Italian Wine (Chianti)',
        description: 'Classic Chianti Classico red wine from Tuscany',
        price: 24500,
        image: '/api/placeholder/300/200',
        rating: 4.9,
        reviewCount: 89,
        prepTime: '0 mins',
        isAvailable: true,
        category: 'Drink',
        size: '750ml'
      }
    ],
    sides: [
      {
        id: 's1',
        name: 'Garlic Bread',
        description: 'Homemade focaccia with roasted garlic, herbs, and olive oil',
        price: 5500,
        image: '/api/placeholder/300/200',
        rating: 4.7,
        reviewCount: 98,
        prepTime: '10 mins',
        isAvailable: true,
        category: 'Side'
      },
      {
        id: 's2',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan, croutons, and Caesar dressing',
        price: 7500,
        image: '/api/placeholder/300/200',
        rating: 4.6,
        reviewCount: 76,
        prepTime: '8 mins',
        isAvailable: true,
        category: 'Side'
      },
      {
        id: 's3',
        name: 'Antipasto Platter',
        description: 'Selection of Italian meats, cheeses, olives, and marinated vegetables',
        price: 12500,
        image: '/api/placeholder/300/200',
        rating: 4.8,
        reviewCount: 54,
        prepTime: '5 mins',
        isAvailable: true,
        category: 'Side'
      },
      {
        id: 's4',
        name: 'Bruschetta',
        description: 'Toasted bread topped with fresh tomatoes, basil, and balsamic glaze',
        price: 6500,
        image: '/api/placeholder/300/200',
        rating: 4.5,
        reviewCount: 43,
        prepTime: '7 mins',
        isAvailable: true,
        category: 'Side'
      }
    ],
    reviews: [
      {
        id: 1,
        customerName: 'John D.',
        customerAvatar: '/api/placeholder/50/50',
        rating: 5,
        comment: 'Maria\'s carbonara is absolutely incredible! The most authentic I\'ve had outside of Italy. Her technique is flawless and you can taste the love in every bite.',
        date: '2 days ago',
        dishOrdered: 'Spaghetti Carbonara',
        verified: true
      },
      {
        id: 2,
        customerName: 'Sarah M.',
        customerAvatar: '/api/placeholder/50/50',
        rating: 5,
        comment: 'Perfect texture and flavor in the lasagna. You can taste the quality of ingredients. Maria is a true artist in the kitchen. Will definitely order again!',
        date: '1 week ago',
        dishOrdered: 'Homemade Lasagna',
        verified: true
      },
      {
        id: 3,
        customerName: 'Mike R.',
        customerAvatar: '/api/placeholder/50/50',
        rating: 4,
        comment: 'Really good tiramisu, though I prefer it a bit less sweet. Still highly recommend Maria\'s cooking - very authentic and well-prepared.',
        date: '2 weeks ago',
        dishOrdered: 'Tiramisu',
        verified: true
      },
      {
        id: 4,
        customerName: 'Lisa K.',
        customerAvatar: '/api/placeholder/50/50',
        rating: 5,
        comment: 'The risotto was creamy perfection! Maria\'s attention to detail shows in every dish. Fast delivery and beautiful presentation too.',
        date: '3 weeks ago',
        dishOrdered: 'Risotto ai Funghi',
        verified: true
      }
    ]
  }
};

const CookProfilePage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { addToCart } = useCart();
  const [cook, setCook] = useState<any>(null);
  const [cookId, setCookId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dishes' | 'about' | 'reviews'>('dishes');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'main' | 'drinks' | 'sides'>('all');

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setCookId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!cookId) return;
    
    // Simulate fetching cook data - replace with real API call
    const fetchCook = async () => {
      try {
        // For now, use mock data
        const cookData = mockCookProfiles[cookId as keyof typeof mockCookProfiles];
        if (cookData) {
          setCook(cookData);
        }
      } catch (error) {
        console.error('Error fetching cook:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCook();
  }, [cookId]);

  const handleAddToCart = (item: any) => {
    const cartItem = {
      dishId: item.id,
      name: item.name,
      price: item.price,
      image: item.image || 'placeholder.jpg',
      cookerName: cook?.name || 'Unknown Cook',
      cookerId: cookId,
      cookerAvatar: cook?.avatar || '',
      quantity: 1,
      prepTime: item.prepTime || '30 min',
      category: item.category || 'main'
    };
    
    addToCart(cartItem);
    toast.success(`Added ${item.name} to cart!`, {
      action: {
        label: 'View Cart',
        onClick: () => router.push('/cart')
      }
    });
  };

  // Combine all items for filtering
  const getAllItems = () => {
    if (!cook) return [];
    return [...cook.dishes, ...cook.drinks, ...cook.sides];
  };

  const getFilteredItems = () => {
    const allItems = getAllItems();
    if (selectedCategory === 'all') return allItems;
    if (selectedCategory === 'main') return cook.dishes;
    if (selectedCategory === 'drinks') return cook.drinks;
    if (selectedCategory === 'sides') return cook.sides;
    return allItems;
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
          <p className="text-muted-foreground mb-4">The cook you're looking for doesn't exist or has been removed.</p>
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
                onClick={logout}
                className="text-muted-foreground hover:text-destructive"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image & Profile Header */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-orange-400 to-red-500 relative overflow-hidden">
          <img 
            src={cook.coverImage} 
            alt={`${cook.name} kitchen`}
            className="w-full h-full object-cover opacity-80"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        <div className="container mx-auto px-4">
          <div className="relative -mt-16 pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={cook.avatar} />
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
                        <span className="text-muted-foreground">{cook.location}</span>
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
                    <Button className="w-full md:w-auto">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Cook
                    </Button>
                    <Button variant="outline" className="w-full md:w-auto">
                      <Heart className="h-4 w-4 mr-2" />
                      Follow
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
              <div className="text-2xl font-bold text-primary">{cook.dishes.length + cook.drinks.length + cook.sides.length}</div>
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
                {getFilteredItems().filter((item: any) => item.isAvailable).length} of {getFilteredItems().length} available
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
                Drinks ({cook.drinks.length})
              </Button>
              <Button
                variant={selectedCategory === 'sides' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('sides')}
              >
                Sides ({cook.sides.length})
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredItems().map((item: any) => (
                <Card key={item.id} className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${!item.isAvailable ? 'opacity-60' : ''}`}
                      onClick={() => {
                        if (item.category === 'Main Dish') {
                          router.push(`/dishes/${item.id}`);
                        }
                      }}>
                  <div className="aspect-[4/3] relative">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVIMTc1VjEyNUgxMjVWNzVaIiBmaWxsPSIjOUI5QkEzIi8+PC9zdmc+';
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
                        {item.size && (
                          <div className="text-xs text-muted-foreground">{item.size}</div>
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
                        addToCart(item);
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
                  {cook.achievements.map((achievement: any, index: number) => (
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
                  {cook.favoriteIngredients.map((ingredient: string) => (
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
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Customer Reviews</h2>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{cook.rating}</span>
                <span className="text-muted-foreground">({cook.reviewCount} reviews)</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {cook.reviews.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.customerAvatar} />
                        <AvatarFallback>
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{review.customerName}</span>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">• {review.dishOrdered}</span>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookProfilePage;
