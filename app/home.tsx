'use client';

import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import FeaturedCarousel from '../components/FeaturedCarousel';
import Testimonials from '../components/Testimonials';
import SignUpModal from '../components/SignUpModal';
import SignInModal from '../components/SignInModal';
import Footer from '../components/Footer';
import { DishesService, CooksService } from '@/lib/firebase/dataService';
import { Dish, Cook } from '@/lib/firebase/dataService';

interface FeaturedDish extends Dish {
  cooker: string;
  location: string;
}

export default function Home() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [featuredDishes, setFeaturedDishes] = useState<FeaturedDish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedDishes();
  }, []);

  const fetchFeaturedDishes = async () => {
    try {
      setLoading(true);
      const [dishesData, cooksData] = await Promise.all([
        DishesService.getAllDishes(),
        CooksService.getAllCooks()
      ]);
      
      // Create a map of cooks for quick lookup
      const cooksMap = new Map(cooksData.map((cook: Cook) => [cook.id, cook]));
      
      // Get top-rated available dishes
      const topRatedDishes = dishesData
        .filter((dish: Dish) => dish.isAvailable && dish.rating >= 4.5) // Only available dishes with high ratings
        .sort((a: Dish, b: Dish) => b.rating - a.rating) // Sort by rating descending
        .slice(0, 6) // Take top 6 dishes
        .map((dish: Dish) => {
          const cook = cooksMap.get(dish.cookerId);
          return {
            ...dish,
            cooker: cook?.displayName || 'Cocinero Desconocido',
            location: `${(Math.random() * 3 + 0.5).toFixed(1)} km de distancia`
          };
        });
      
      setFeaturedDishes(topRatedDishes);
    } catch (error) {
      console.error('Error fetching featured dishes:', error);
      // Fallback to empty array if there's an error
      setFeaturedDishes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <main>
        <Hero onSignUpClick={() => setIsSignUpModalOpen(true)} onSignInClick={() => setIsSignInModalOpen(true)} />
        <HowItWorks />
        <FeaturedCarousel dishes={featuredDishes as any} />
        <Testimonials />
      </main>

      <SignUpModal isOpen={isSignUpModalOpen} onOpenChange={setIsSignUpModalOpen} />
      <SignInModal isOpen={isSignInModalOpen} onOpenChange={setIsSignInModalOpen} />

      <Footer />
    </div>
  );
}
