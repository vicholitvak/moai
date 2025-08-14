
  'use client';

  import { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import { useAuth } from '@/context/AuthContext';
  import Head from 'next/head';
  import Hero from '../components/Hero';
  import HowItWorks from '../components/HowItWorks';
  import SignUpModal from '../components/SignUpModal';
  import MobileNav from '../components/MobileNav';
  import RecommendationDashboard from '@/components/RecommendationDashboard';
  import FeaturedCarousel from '@/components/FeaturedCarousel';
  import Testimonials from '@/components/Testimonials';
  import { PerformanceService } from '@/lib/services/performanceService';

  export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    return (
      <div>
        <Head>
          <title>Moai Delivery App - San Pedro de Atacama</title>
          <meta name="description" content="Restaurantes, deliverys y repartidores juntos en Moai." />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <MobileNav 
          onSignInClick={() => router.push('/login')}
          onSignUpClick={() => setIsModalOpen(true)}
        />

        <main className="lg:pt-0">
          <Hero 
            onSignUpClick={() => setIsModalOpen(true)} 
            onSignInClick={() => router.push('/login')} 
          />
          
          <HowItWorks />

          {/* Featured Dishes Section */}
          <section className="py-12 md:py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  Platos Destacados
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Descubre los mejores platos de nuestros cocineros locales
                </p>
              </div>
              <FeaturedCarousel />
            </div>
          </section>

          {/* Recommendations Section - Only for logged in clients */}
          {showRecommendations && (
            <section className="py-12 md:py-20 bg-muted/30">
              <div className="container mx-auto px-4">
                <RecommendationDashboard />
              </div>
            </section>
          )}

          {/* Testimonials Section */}
          <section className="py-12 md:py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  Qué dice la gente
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Experiencias reales de nuestros clientes y cocineros
                </p>
              </div>
              <Testimonials />
            </div>
          </section>

          {/* Call to Action Section */}
          <section className="py-12 md:py-20 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
                ¿Listo para empezar?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Únete a la comunidad de Moai y disfruta de la mejor comida local
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-orange-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 text-lg"
                >
                  Registrarse
                </button>
                <button
                  onClick={() => router.push('/dishes')}
                  className="bg-white text-orange-600 font-bold py-4 px-8 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-lg border-2 border-orange-600"
                >
                  Explorar Platos
                </button>
              </div>
            </div>
          </section>
        </main>

        <SignUpModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />

        <footer className="bg-gray-800 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Moai</h3>
                <p className="text-gray-300">
                  Conectando cocineros locales, repartidores y clientes en San Pedro de Atacama.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Para Clientes</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="/dishes" className="hover:text-white transition-colors">Explorar Platos</a></li>
                  <li><a href="/cooks" className="hover:text-white transition-colors">Ver Cocineros</a></li>
                  <li><a href="/orders" className="hover:text-white transition-colors">Mis Pedidos</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Para Cocineros</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="/cooker/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                  <li><a href="/cooker/onboarding" className="hover:text-white transition-colors">Registrarse</a></li>
                  <li><a href="/help" className="hover:text-white transition-colors">Ayuda</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Para Repartidores</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="/driver/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                  <li><a href="/driver/onboarding" className="hover:text-white transition-colors">Registrarse</a></li>
                  <li><a href="/help" className="hover:text-white transition-colors">Ayuda</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
              <p>&copy; 2025 Moai. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
