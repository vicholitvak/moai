'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, User, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Review } from '@/types';
import { ReviewsService } from '@/lib/firebase/dataService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ReviewSystemProps {
  cookerId?: string;
  dishId?: string;
  dishName?: string;
  orderId?: string;
  onReviewSubmit?: () => void;
}

export function ReviewSystem({ 
  cookerId, 
  dishId, 
  dishName,
  orderId,
  onReviewSubmit 
}: ReviewSystemProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: [0, 0, 0, 0, 0]
  });

  useEffect(() => {
    if (cookerId) {
      loadReviews();
    }
  }, [cookerId, dishId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      let fetchedReviews: Review[] = [];
      
      if (dishId) {
        fetchedReviews = await ReviewsService.getReviewsByDish(dishId);
      } else if (cookerId) {
        fetchedReviews = await ReviewsService.getReviewsByCook(cookerId);
      }
      
      setReviews(fetchedReviews);
      
      // Calculate stats
      if (fetchedReviews.length > 0) {
        const sum = fetchedReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = sum / fetchedReviews.length;
        const dist = [0, 0, 0, 0, 0];
        
        fetchedReviews.forEach(r => {
          dist[r.rating - 1]++;
        });
        
        setStats({
          average: avg,
          total: fetchedReviews.length,
          distribution: dist
        });
      }
      
      // Check if current user has already reviewed
      if (user && fetchedReviews.some(r => r.customerId === user.uid)) {
        setHasReviewed(true);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user || !cookerId || rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Por favor escribe un comentario más detallado (mínimo 10 caracteres)');
      return;
    }

    try {
      setSubmitting(true);
      
      const reviewData = {
        customerId: user.uid,
        customerName: user.displayName || 'Usuario',
        customerAvatar: user.photoURL || '',
        cookerId,
        dishId,
        dishName,
        orderId,
        rating,
        comment: comment.trim(),
        verified: !!orderId // Verified if it's from an order
      };

      const reviewId = await ReviewsService.createReview(reviewData);
      
      if (reviewId) {
        toast.success('¡Reseña publicada exitosamente!');
        setRating(0);
        setComment('');
        setShowForm(false);
        setHasReviewed(true);
        loadReviews();
        onReviewSubmit?.();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Error al publicar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const RatingStars = ({ 
    value, 
    size = 'md', 
    interactive = false,
    onRate = () => {} 
  }: { 
    value: number; 
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onRate?: (rating: number) => void;
  }) => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={cn(
              "transition-all",
              interactive && "hover:scale-110"
            )}
          >
            <Star
              className={cn(
                sizes[size],
                "transition-colors",
                (interactive ? (hoverRating || value) : value) >= star
                  ? "fill-atacama-orange text-atacama-orange"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-atacama-orange"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <Card>
        <CardHeader>
          <CardTitle>Reseñas y Calificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-atacama-orange">
                {stats.average.toFixed(1)}
              </div>
              <RatingStars value={Math.round(stats.average)} size="lg" />
              <p className="text-sm text-muted-foreground mt-1">
                {stats.total} reseña{stats.total !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star - 1];
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm w-3">{star}</span>
                    <Star className="h-4 w-4 fill-atacama-orange text-atacama-orange" />
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Review Button */}
          {user && !hasReviewed && !showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full mt-6 bg-atacama-orange hover:bg-atacama-orange/90"
            >
              Escribir una reseña
            </Button>
          )}

          {/* Review Form */}
          {showForm && (
            <Card className="mt-6 border-atacama-orange/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Tu calificación
                    </label>
                    <RatingStars 
                      value={rating} 
                      size="lg" 
                      interactive 
                      onRate={setRating}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Tu comentario
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Comparte tu experiencia con este plato o cocinero..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo 10 caracteres
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={submitReview}
                      disabled={submitting || rating === 0}
                      className="flex-1 bg-atacama-orange hover:bg-atacama-orange/90"
                    >
                      {submitting ? 'Publicando...' : 'Publicar reseña'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setRating(0);
                        setComment('');
                      }}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {hasReviewed && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Ya has dejado una reseña</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Todas las reseñas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-gray-100 dark:border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.customerAvatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.customerName}</span>
                            {review.verified && (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                <span>Compra verificada</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <RatingStars value={review.rating} size="sm" />
                            {review.dishName && (
                              <span className="text-sm text-muted-foreground">
                                • {review.dishName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(review.createdAt.toDate(), 'dd MMM yyyy')}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {review.comment}
                      </p>
                      
                      {/* Helpful button (for future implementation) */}
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-atacama-orange transition-colors">
                        <ThumbsUp className="h-3 w-3" />
                        <span>Útil</span>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {reviews.length === 0 && !showForm && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Aún no hay reseñas. ¡Sé el primero en compartir tu experiencia!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}