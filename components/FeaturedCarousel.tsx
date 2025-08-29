'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { Dish } from '../types';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/utils';

const FeaturedCarousel = ({ dishes = [] }: { dishes?: (Dish & { cooker?: string; location?: string })[] }) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!dishes || !Array.isArray(dishes) || dishes.length === 0) return;
      
      const urls = await Promise.all(dishes.map(async (dish) => {
        const response = await fetch(`/api/image?query=${dish.name}&orientation=landscape`);
        const data = await response.json();
        return data.url;
      }));
      setImageUrls(urls);
    };
    
    fetchImages();
  }, [dishes]);

  if (!dishes || dishes.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Platos Destacados</h2>
          <p>No hay platos destacados en este momento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-4xl font-bold text-center mb-12">Platos Destacados</motion.h2>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
        >
          {dishes.map((dish, index) => (
            <SwiperSlide key={dish.id}>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
                {imageUrls[index] && <Image src={imageUrls[index]} alt={dish.name} width={800} height={600} className="w-full h-64 object-cover" />}
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{dish.name}</h3>
                  <p className="text-gray-700 mb-2">{formatPrice(dish.price)}</p>
                  <p className="text-gray-500 text-sm mb-4">by {dish.cookerName} - {dish.cityName || 'Nearby'}</p>
                  <Link href={`/dishes/${dish.id}`} passHref>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full bg-moai-orange text-white py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors">View Details</motion.button>
                  </Link>
                </div>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default FeaturedCarousel;