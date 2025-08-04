
'use client';

import { motion } from 'framer-motion';
import { Search, ShoppingCart, Utensils } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    { icon: <Search size={48} className="mb-4 text-moai-orange" />, title: 'Discover', description: 'Browse menus from talented home cooks in your community.' },
    { icon: <ShoppingCart size={48} className="mb-4 text-moai-orange" />, title: 'Order', description: 'Select your meals and place an order for delivery.' },
    { icon: <Utensils size={48} className="mb-4 text-moai-orange" />, title: 'Enjoy', description: 'Get delicious, homemade food delivered right to your doorstep.' },
  ];

  return (
    <section className="py-20 bg-moai-beige">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-8 bg-white rounded-lg shadow-lg flex flex-col items-center"
            >
              {step.icon}
              <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
              <p>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
