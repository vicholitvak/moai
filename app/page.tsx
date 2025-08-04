
  'use client';

  import { useState } from 'react';
  import { useRouter } from 'next/navigation';
  import Head from 'next/head';
  import Hero from '../components/Hero';
  import HowItWorks from '../components/HowItWorks';
  import SignUpModal from '../components/SignUpModal';
  import MobileNav from '../components/MobileNav';

  export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

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
          {/* Placeholder for Featured Dishes */}
          <section className="py-12 md:py-20">
            <div className="container mx-auto text-center px-4"> 
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12">Platos destacados</h2>
              {/* Carousel would go here */}
              <p className="text-sm md:text-base">Platos destacados coming soon!</p>
            </div>
          </section>

          {/* Placeholder for Testimonials */}
          <section className="py-12 md:py-20 bg-moai-beige">
            <div className="container mx-auto text-center px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12">Qué dice la people</h2>
              <p className="text-sm md:text-base">Testimonials coming soon!</p>
            </div>
          </section>
        </main>

        <SignUpModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />

        <footer className="bg-gray-800 text-white py-8">
          <div className="container mx-auto text-center">
            <p>&copy; 2025 Moai. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    );
  }
