'use client';

  import { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import Link from 'next/link';
  import { useAuth } from '@/context/AuthContext';
  import Head from 'next/head';
  import Hero from '../components/Hero';
  import HowItWorks from '../components/HowItWorks';
  import SignUpModal from '../components/SignUpModal';
  import SignInModal from '../components/SignInModal';
  import MobileNav from '../components/MobileNav';
  import RecommendationDashboard from '@/components/RecommendationDashboard';
  import FeaturedCarousel from '@/components/FeaturedCarousel';
  import Testimonials from '@/components/Testimonials';
  import { PerformanceService } from '@/lib/services/performanceService';
  import { motion } from 'framer-motion';
  import { Button } from '@/components/ui/button';
  import { ModernCard } from '@/components/ui/modern-card';
  import { ModernTestimonial } from '@/components/ui/modern-testimonial';
  import { ChefHat, Clock, MapPin, Star, Users, Award, Heart, TrendingUp } from 'lucide-react';
  import { LocationBasedDishes } from '@/components/LocationBasedDishes';

  export default function Home() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const router = useRouter();
    const { user, role } = useAuth();

    useEffect(() => {
      // Track page load performance
      PerformanceService.trackPageLoadSimple('home');

      // Show recommendations if user is logged in and is a client
      if (user && role === 'Client') {
        setShowRecommendations(true);
      }
    }, [user, role]);

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
        title: 'Crecimiento Constante',
        description: 'Únete a una comunidad en expansión de amantes de la buena comida.'
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
        <Head>
          <title>Moai Delivery App - Todo Chile</title>
          <meta name="description" content="Restaurantes, deliverys y repartidores juntos en Moai. Disfruta de la mejor comida local en todas las ciudades de Chile." />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <MobileNav
          onSignInClick={() => setIsSignInModalOpen(true)}
          onSignUpClick={() => setIsSignUpModalOpen(true)}
        />

  <main>
          <Hero
            onSignUpClick={() => setIsSignUpModalOpen(true)}
            onSignInClick={() => setIsSignInModalOpen(true)}
          />

          {/* Stats Section */}
          <motion.section
            className="py-16 bg-white/50 backdrop-blur-sm"
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

          {/* How It Works Section */}
          <motion.section
            className="py-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="container mx-auto px-4">
              <motion.div variants={itemVariants} className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ¿Cómo Funciona?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Tres simples pasos para disfrutar de la mejor comida casera
                </p>
              </motion.div>

              <HowItWorks />
            </div>
          </motion.section>

          {/* Features Section */}
          <motion.section
            className="py-20 bg-gradient-to-r from-orange-50/50 to-red-50/30"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="container mx-auto px-4">
              <motion.div variants={itemVariants} className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  ¿Por Qué Elegir Moai?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Descubre las ventajas que nos hacen únicos
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                  <motion.div key={feature.title} variants={itemVariants}>
                    <ModernCard variant="elevated" className="p-6 h-full text-center group">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 rounded-full bg-gradient-to-br from-moai-500 to-pacific-500 text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
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

          {/* Featured Dishes Section */}
          <FeaturedCarousel />

          {/* Recommendations Section - Only for logged in clients */}
          {showRecommendations && (
            <motion.section
              className="py-20 bg-gradient-to-r from-pacific-50/50 to-blue-50/30"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="container mx-auto px-4">
                <RecommendationDashboard />
              </div>
            </motion.section>
          )}

          {/* Location-Based Dishes Section */}
          <motion.section
            className="py-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="container mx-auto px-4">
              <LocationBasedDishes />
            </div>
          </motion.section>

          {/* Testimonials Section */}
          <motion.section
            className="py-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="container mx-auto px-4">
              <motion.div variants={itemVariants} className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Qué Dice la Gente
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Experiencias reales de nuestros clientes y cocineros
                </p>
              </motion.div>
              <Testimonials />
            </div>
          </motion.section>

          {/* Call to Action Section */}
          <motion.section
            className="py-20 bg-gradient-to-br from-moai-500 via-orange-600 to-red-600 relative overflow-hidden"
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
                  ¿Listo para Empezar?
                </h2>
                <Button
                  size="xl"
                  className="bg-white text-moai-600 font-bold px-10 py-4 rounded-full shadow-lg hover:bg-moai-50 hover:text-moai-700 transition-all duration-300"
                  onClick={() => router.push('/dishes')}
                >
                  Explorar Platos
                </Button>
              </motion.div>
            </div>
          </motion.section>
        </main>

  <SignUpModal isOpen={isSignUpModalOpen} onOpenChange={setIsSignUpModalOpen} />
  <SignInModal isOpen={isSignInModalOpen} onOpenChange={setIsSignInModalOpen} />

        {/* Enhanced Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-moai-400 to-pacific-400 bg-clip-text text-transparent">
                  Moai
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Conectando cocineros locales, repartidores y clientes en todo Chile con pasión por la buena comida.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-white">Para Clientes</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><Link href="/dishes" className="hover:text-moai-400 transition-colors">Explorar Platos</Link></li>
                  <li><Link href="/cooks" className="hover:text-moai-400 transition-colors">Ver Cocineros</Link></li>
                  <li><Link href="/orders" className="hover:text-moai-400 transition-colors">Mis Pedidos</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-white">Para Cocineros</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="/cooker/dashboard" className="hover:text-moai-400 transition-colors">Dashboard</a></li>
                  <li><a href="/cooker/onboarding" className="hover:text-moai-400 transition-colors">Registrarse</a></li>
                  <li><a href="/help" className="hover:text-moai-400 transition-colors">Ayuda</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-white">Para Repartidores</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="/driver/dashboard" className="hover:text-moai-400 transition-colors">Dashboard</a></li>
                  <li><a href="/driver/onboarding" className="hover:text-moai-400 transition-colors">Registrarse</a></li>
                  <li><a href="/help" className="hover:text-moai-400 transition-colors">Ayuda</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-8 text-center text-gray-300">
              <p>&copy; 2025 Moai. Todos los derechos reservados. Hecho con ❤️ en el desierto.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
