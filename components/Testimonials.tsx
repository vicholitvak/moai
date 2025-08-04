'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Testimonial } from '../types';
import { motion } from 'framer-motion';

const testimonialsData: Testimonial[] = [
  {
    quote: "The best local empanadas I've ever had! So fresh and delivered right on time. It felt like a home-cooked meal from a neighbor.",
    name: 'Maria S.',
    role: 'Happy Client',
    query: 'woman,portrait',
  },
  {
    quote: "As a cooker, Moai has been a game-changer. I get to share my passion for food with my community and earn extra income. The platform is so easy to use!",
    name: 'David L.',
    role: 'Home Cook',
    query: 'man,portrait',
  },
  {
    quote: "Driving for Moai is flexible and rewarding. I love being part of a system that connects local people through food. The app makes deliveries a breeze.",
    name: 'Chen W.',
    role: 'Delivery Driver',
    query: 'person,portrait',
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const fetchImage = async () => {
      const response = await fetch(`/api/image?query=${testimonial.query}&orientation=portrait`);
      const data = await response.json();
      setImageUrl(data.url);
    };
    fetchImage();
  }, [testimonial.query]);

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
      <p className="text-gray-600 italic mb-6">&quot;{testimonial.quote}&quot;</p>
      <div className="flex items-center justify-center">
        {imageUrl && <Image src={imageUrl} alt={testimonial.name} width={60} height={60} className="rounded-full mr-4" />}
        <div>
          <p className="font-bold text-lg">{testimonial.name}</p>
          <p className="text-gray-500">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials = () => {
  return (
    <section className="py-20 bg-moai-beige">
      <div className="container mx-auto text-center">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-4xl font-bold mb-12">What Our Community is Saying</motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialsData.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;