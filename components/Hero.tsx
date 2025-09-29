'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Star, Users, Award, MapPin, ChefHat, Truck, ShoppingBag } from 'lucide-react';

const Hero = ({ onSignUpClick, onSignInClick }: { onSignUpClick: () => void, onSignInClick: () => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const heroSlides = [
    {
      image: '/moai-food-hero.jpg',
      title: '¡La mejor comida casera de todo Chile!',
      subtitle: 'Descubre, ordena y disfruta platos auténticos preparados por cocineros locales en tu ciudad.',
      cta: 'Explora platos cerca de ti',
      icon: ShoppingBag
    },
    {
      image: '/valleluna.jpg',
      title: '¿Eres cocinero?',
      subtitle: 'Convierte tu pasión culinaria en un negocio. Cocina desde casa y comparte tus recetas.',
      cta: 'Únete como cocinero',
      icon: ChefHat
    },
    {
      image: '/moai-food-hero.jpg',
      title: '¿Quieres ganar dinero entregando?',
      subtitle: 'Sé conductor en Moai. Horarios flexibles y ganancias inmediatas.',
      cta: 'Regístrate como conductor',
      icon: Truck
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    enter: { opacity: 0, scale: 1.1 },
    center: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <div className="relative min-h-[80vh] md:min-h-screen h-[80vh] md:h-screen overflow-hidden flex items-center justify-center">
      {/* Background Slideshow */}
      <motion.div
        key={currentSlide}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 blur-[1.5px] md:blur-none"
        style={{
          backgroundImage: `url(${heroSlides[currentSlide].image})`,
          backgroundAttachment: 'fixed'
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-10" />
      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-2xl mb-4 tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {heroSlides[currentSlide].title}
        </motion.h1>
        <motion.p
          className="text-lg md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {heroSlides[currentSlide].subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            size="lg"
            className="bg-white text-atacama-brown font-bold px-8 py-4 rounded-full shadow-2xl text-lg transition-all duration-200 border-2 border-atacama-orange hover:bg-atacama-orange/10 hover:text-atacama-orange"
            onClick={onSignUpClick}
          >
            {heroSlides[currentSlide].cta}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="ml-4 mt-4 md:mt-0 border-atacama-orange text-atacama-orange font-bold px-8 py-4 rounded-full shadow text-lg transition-all duration-200 hover:bg-atacama-orange/10"
            onClick={onSignInClick}
          >
            Iniciar Sesión
          </Button>
        </motion.div>
      </div>
      {/* Slide Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full border-2 ${currentSlide === idx ? 'bg-atacama-orange border-white' : 'bg-white/60 border-white/30'} transition-all`}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Hero;
