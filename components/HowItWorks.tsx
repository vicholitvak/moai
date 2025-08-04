
'use client';

import { motion } from 'framer-motion';
import { Search, ShoppingCart, Utensils } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    { icon: <Search size={40} className="mb-3 md:mb-4 text-moai-orange mx-auto" />, title: 'Descubre', description: 'Busca la comida que más te guste entre platos únicos de chefs locales' },
    { icon: <ShoppingCart size={40} className="mb-3 md:mb-4 text-moai-orange mx-auto" />, title: 'Pide', description: 'Crea una orden para esa comida' },
    { icon: <Utensils size={40} className="mb-3 md:mb-4 text-moai-orange mx-auto" />, title: 'Disfruta', description: 'Puedes retirar tu pedido o recibir en la puerta de tu casa.' },
  ];

  return (
    <section className="py-12 md:py-20 bg-moai-beige">
      <div className="container mx-auto text-center px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 md:mb-12">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-6 md:p-8 bg-white rounded-lg shadow-lg flex flex-col items-center text-center max-w-sm mx-auto"
            >
              {step.icon}
              <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">{step.title}</h3>
              <p className="text-sm md:text-base leading-relaxed text-gray-700">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
