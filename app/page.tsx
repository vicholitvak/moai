'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import Hero from '../components/Hero';
import SignUpModal from '../components/SignUpModal';
import MobileNav from '../components/MobileNav';
import RecommendationDashboard from '@/components/RecommendationDashboard';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { PerformanceService } from '@/lib/services/performanceService';
import { LocationService } from '@/lib/services/locationService';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ModernCard } from '@/components/ui/modern-card';
import { ChefHat, Clock, MapPin, Star, Users, Award, Heart, TrendingUp, Search, Navigation } from 'lucide-react';
import { LocationBasedDishes } from '@/components/LocationBasedDishes';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city?: string } | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const router = useRouter();
  const { user, role } = useAuth();

  useEffect(() => {
    // Track page load performance
    PerformanceService.trackPageLoadSimple('home');

    // Show recommendations if user is logged in and is a client
    if (user && role === 'Client') {
      setShowRecommendations(true);
    }

    // Get user's location
    detectUserLocation();
  }, [user, role]);

  const detectUserLocation = async () => {
    try {
      const position = await LocationService.getCurrentPosition();
      const address = await LocationService.getAddressFromCoordinates(
        position.latitude,
        position.longitude
      );

      setUserLocation({
        lat: position.latitude,
        lng: position.longitude,
        city: address.city
      });
    } catch (error) {
      console.error('Error detecting location:', error);
      // Set default to Santiago
      setUserLocation({
        lat: -33.4489,
        lng: -70.6693,
        city: 'Santiago'
      });
    }
  };

  const handleLocationSearch = async () => {
    if (!searchLocation.trim()) {
      toast.error('Ingresa una ubicación');
      return;
    }

    // This is a simplified version - in production, integrate with geocoding API
    toast.info(`Buscando disponibilidad en ${searchLocation}...`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const stats = [
    { icon: Users, label: 'Cocineros Activos', value: '500+', color: 'text-blue-600' },
    { icon: ChefHat, label: 'Platos Disponibles', value: '2000+', color: 'text-orange-600' },
    { icon: Star, label: 'Calificación Promedio', value: '4.8', color: 'text-yellow-600' },
    { icon: MapPin, label: 'Ciudades Cubiertas', value: '12+', color: 'text-green-600' }
  ];

  const features = [
    {
      icon: Clock,
      title: 'Entrega Rápida',
      description: 'Recibe tu comida en menos de 45 minutos con nuestro sistema de delivery optimizado.'
    },
    {
      icon: Heart,
      title: 'Comida Casera',
      description: 'Disfruta de platos preparados con amor por cocineros locales expertos.'
    },
    {
      icon: Award,
      title: 'Calidad Garantizada',
      description: 'Todos nuestros cocineros pasan por un riguroso proceso de selección.'
    },
    {
      icon: TrendingUp,
      title: 'Precios Justos',
      description: 'Apoya a cocineros locales y obtén mejor comida a precios más accesibles.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      <Head>
        <title>LicanÑam - Comida Casera a tu Puerta | Delivery en Chile</title>
        <meta name="description" content="Descubre la mejor comida casera preparada por cocineros locales. Delivery rápido en Santiago y principales ciudades de Chile. ¡Pide ahora!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MobileNav
        onSignInClick={() => router.push('/login')}
        onSignUpClick={() => setIsModalOpen(true)}
      />

      <main>
        {/* Hero Section */}
        <Hero
          onSignUpClick={() => setIsModalOpen(true)}
          onSignInClick={() => router.push('/login')}
        />

        {/* Location Search Section */}
        <motion.section
          className="py-12 bg-white shadow-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <motion.div variants={itemVariants} className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
                  ¿A dónde entregamos tu pedido?
                </h2>
                <p className="text-gray-600">
                  {userLocation?.city ? `Ubicación actual: ${userLocation.city}` : 'Detectando tu ubicación...'}
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Ingresa tu dirección o ciudad"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-12 pr-4 py-6 text-lg border-2 border-gray-200 focus:border-primary rounded-full"
                    onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                  />
                </div>
                <Button
                  onClick={detectUserLocation}
                  variant="outline"
                  size="lg"
                  className="rounded-full px-6"
                >
                  <Navigation className="h-5 w-5 mr-2" />
                  Usar mi ubicación
                </Button>
                <Button
                  onClick={handleLocationSearch}
                  size="lg"
                  className="rounded-full px-8 bg-gradient-to-r from-atacama-orange to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Buscar
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section
          className="py-16 bg-gradient-to-r from-orange-50/50 to-red-50/30"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  className="text-center group"
                >
                  <ModernCard variant="glass" className="p-6 hover-lift">
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`p-3 rounded-full bg-gradient-to-br from-white to-gray-50 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    </div>
                  </ModernCard>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Featured Dishes Section */}
        <motion.section
          className="py-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-4">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Platos Destacados Cerca de Ti
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {userLocation?.city
                  ? `Descubre los mejores platos en ${userLocation.city}`
                  : 'Descubre los mejores platos de nuestros cocineros locales'}
              </p>
            </motion.div>
            <FeaturedCarousel />
          </div>
        </motion.section>

        {/* Recommendations Section - Only for logged in clients */}
        {showRecommendations && (
          <motion.section
            className="py-20 bg-gradient-to-r from-blue-50/50 to-purple-50/30"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="container mx-auto px-4">
              <motion.div variants={itemVariants} className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Recomendado Para Ti
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Basado en tus preferencias y pedidos anteriores
                </p>
              </motion.div>
              <RecommendationDashboard />
            </div>
          </motion.section>
        )}

        {/* Location-Based Dishes Section */}
        <motion.section
          className="py-20 bg-gradient-to-r from-green-50/50 to-blue-50/30"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-4">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Explora por Ciudad
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Descubre sabores únicos de diferentes regiones de Chile
              </p>
            </motion.div>
            <LocationBasedDishes />
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          className="py-20 bg-white"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-4">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-atacama-orange to-red-600 bg-clip-text text-transparent">
                ¿Por Qué Elegir LicanÑam?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                La manera más auténtica de disfrutar comida casera
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div key={feature.title} variants={itemVariants}>
                  <ModernCard variant="elevated" className="p-6 h-full text-center group">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 rounded-full bg-gradient-to-br from-atacama-orange to-red-500 text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <feature.icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </ModernCard>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Call to Action Section */}
        <motion.section
          className="py-20 bg-gradient-to-br from-atacama-orange via-orange-600 to-red-600 relative overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                ¿Listo para Disfrutar Comida Auténtica?
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                Únete a LicanÑam y conecta con cocineros locales en tu ciudad
              </p>
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button
                  onClick={() => setIsModalOpen(true)}
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold rounded-full bg-white text-atacama-orange hover:bg-gray-100 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Registrarse Gratis
                </Button>
                <Button
                  onClick={() => router.push('/dishes')}
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold rounded-full border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  <ChefHat className="mr-2 h-5 w-5" />
                  Ver Platos Disponibles
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <SignUpModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-atacama-orange to-orange-400 bg-clip-text text-transparent">
                LicanÑam
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Conectando cocineros locales con clientes que buscan comida casera auténtica en todo Chile.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Para Clientes</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/dishes" className="hover:text-atacama-orange transition-colors">Explorar Platos</a></li>
                <li><a href="/cooks" className="hover:text-atacama-orange transition-colors">Ver Cocineros</a></li>
                <li><a href="/client/orders" className="hover:text-atacama-orange transition-colors">Mis Pedidos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Para Cocineros</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/cooker/dashboard" className="hover:text-atacama-orange transition-colors">Dashboard</a></li>
                <li><a href="/signup" className="hover:text-atacama-orange transition-colors">Registrarse</a></li>
                <li><a href="/support" className="hover:text-atacama-orange transition-colors">Soporte</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Para Repartidores</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/driver/dashboard" className="hover:text-atacama-orange transition-colors">Dashboard</a></li>
                <li><a href="/signup" className="hover:text-atacama-orange transition-colors">Registrarse</a></li>
                <li><a href="/support" className="hover:text-atacama-orange transition-colors">Soporte</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-300">
            <p>&copy; 2025 LicanÑam. Todos los derechos reservados. Hecho con ❤️ en Chile.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}