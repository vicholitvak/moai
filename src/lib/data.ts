// This file contains the static data for the app.
// In a real application, this data would likely be fetched from a database.

export interface Drink {
    name: string;
    price: number; // Price in CLP
}

export interface Dish {
    id: string;
    name: string;
    cook: string;
    rating: number;
    reviews: number;
    price: number; // Price in CLP
    image: string;
    hint: string;
    tags: string[];
    distance: number;
    description: string;
    chefDescription: string;
    suggestedDrinks?: Drink[];
}

export type OrderStatus = "Order Placed" | "Preparing Food" | "Ready for Pickup" | "Out for Delivery" | "Delivered";

export interface Order {
    id: string;
    dishId: string;
    quantity: number;
    status: OrderStatus;
    customerName: string; // Placeholder for now
    verificationCode: string;
}


export const allDishes: Dish[] = [
    {
      id: '1',
      name: 'Empanadas de Pino',
      cook: 'Doña Elena',
      rating: 4.9,
      reviews: 152,
      price: 2500,
      image: 'https://images.unsplash.com/photo-1625938135336-3b561a7a4a9b?q=80&w=600',
      hint: 'empanada chilean food',
      tags: ['Chilena', 'Clásico'],
      distance: 2.1,
      description: "La empanada de pino tradicional, horneada a la perfección con un relleno jugoso de carne, cebolla, huevo y aceituna.",
      chefDescription: "Cada empanada que hago lleva la receta de mi abuela. Uso solo los mejores ingredientes locales para el pino, y la masa es amasada a mano cada mañana. Es el sabor de la celebración y la familia chilena, directamente desde mi horno a su mesa. ¡Espero que les guste!",
      suggestedDrinks: [
          { name: 'Vino Tinto Carmenere', price: 4500 },
          { name: 'Mote con Huesillo', price: 2000 },
          { name: 'Cerveza Austral', price: 2500 },
      ]
    },
    {
      id: '2',
      name: 'Pastel de Choclo',
      cook: 'Maestro Lucho',
      rating: 4.8,
      reviews: 112,
      price: 7500,
      image: 'https://images.unsplash.com/photo-1688001220443-0c46b14a28f7?q=80&w=600',
      hint: 'pastel de choclo chilean',
      tags: ['Chilena', 'Casero'],
      distance: 3.5,
      description: "Un clásico pastel de choclo con una suave cubierta de maíz y un sabroso relleno de pino de carne, pollo y huevo.",
      chefDescription: "Mi secreto está en el choclo humero, que muelo fresco para obtener esa dulzura y cremosidad únicas. El pino lo cocino a fuego lento por horas para que todos los sabores se unan. Es un plato que me recuerda mi infancia en el campo, y me encanta compartirlo.",
    },
    {
      id: '7',
      name: 'Spaghetti Carbonara',
      cook: 'Chef Isabella',
      rating: 4.9,
      reviews: 132,
      price: 12500,
      image: 'https://images.unsplash.com/photo-1588013273468-31508b946d4d?q=80&w=600',
      hint: 'pasta italian food',
      tags: ['Italian', 'Classic'],
      distance: 2.5,
      description: 'Authentic Spaghetti Carbonara with crispy guanciale, pecorino romano, and a creamy egg yolk sauce.',
      chefDescription: "This isn't your average carbonara. I use a recipe I learned in Rome, with imported guanciale and Pecorino Romano cheese. No cream, just the rich, authentic flavor of Italy in every bite. It's my signature dish for a reason!",
      suggestedDrinks: [
        {name: 'Chianti Classico', price: 8000},
        {name: 'San Pellegrino', price: 2500},
      ],
    },
    {
      id: '8',
      name: 'Gourmet Burger & Fries',
      cook: 'Grillmaster Joe',
      rating: 4.8,
      reviews: 98,
      price: 11000,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
      hint: 'burger fries',
      tags: ['American', 'Comfort Food'],
      distance: 1.8,
      description: 'Juicy beef patty with aged cheddar, special sauce, and all the fixings, served with crispy hand-cut fries.',
      chefDescription: 'I believe a burger can be a work of art. I grind my own beef blend daily, bake my own brioche buns, and my special sauce recipe is a closely guarded secret. It’s the burger you dream about.',
    },
    {
      id: '3',
      name: 'Cazuela de Vacuno',
      cook: 'Doña Elena',
      rating: 4.9,
      reviews: 180,
      price: 6900,
      image: 'https://images.unsplash.com/photo-1688001220421-a70d12ec32c3?q=80&w=600',
      hint: 'cazuela soup chilean',
      tags: ['Chilena', 'Sopa'],
      distance: 2.1,
      description: "Una contundente y sabrosa sopa de vacuno con papas, zapallo, choclo y un toque de cilantro fresco.",
      chefDescription: "No hay nada como una buena cazuela para reponer el alma. La mía es como la que hacía mi mamá: con un caldo lleno de sabor, verduras frescas de la vega y carne que se desarma en la boca. Es el plato perfecto para un día de frío o cuando necesitas un abrazo en forma de comida.",
      suggestedDrinks: [
          { name: 'Ensalada Chilena', price: 1500 },
          { name: 'Jugo de Frambuesa Natural', price: 2000 },
      ]
    },
    {
      id: '9',
      name: 'Fresh Salmon Poke Bowl',
      cook: 'Sushi Sensei Kenji',
      rating: 4.9,
      reviews: 150,
      price: 13500,
      image: 'https://images.unsplash.com/photo-1552561546-b3684de85a88?q=80&w=600',
      hint: 'poke bowl healthy',
      tags: ['Healthy', 'Hawaiian'],
      distance: 3.2,
      description: 'A vibrant bowl of sushi rice, fresh salmon, avocado, edamame, and a delicious sesame-soy dressing.',
      chefDescription: 'Freshness is everything. I source my salmon daily from the market to ensure the highest quality. Each bowl is a balance of flavors and textures, designed to be both healthy and incredibly satisfying.',
    },
    {
      id: '4',
      name: 'Lentejas Veganas',
      cook: 'Cocina de la Pacha',
      rating: 4.7,
      reviews: 95,
      price: 5500,
      image: 'https://images.unsplash.com/photo-1599921671973-424d4d485f83?q=80&w=600',
      hint: 'lentejas vegan soup',
      tags: ['Vegano', 'Chilena'],
      distance: 4.2,
      description: "Un plato de lentejas lleno de sabor, preparado con arroz, zapallo, y un sofrito de verduras. 100% vegano.",
      chefDescription: "Mi cocina celebra los sabores de la tierra. Estas lentejas son mi versión de un clásico de invierno, pero sin productos animales. El secreto es el sofrito y un toque de merkén para darles un gustito ahumado. Son nutritivas, deliciosas y hechas con mucho amor y respeto por nuestros ingredientes.",
    },
    {
      id: '10',
      name: 'Vegan Pad Thai',
      cook: 'Plant-based Queen Anya',
      rating: 4.7,
      reviews: 85,
      price: 11500,
      image: 'https://images.unsplash.com/photo-1623861212863-74d13e3821ce?q=80&w=600',
      hint: 'pad thai vegan',
      tags: ['Vegan', 'Thai'],
      distance: 4.5,
      description: 'Classic Pad Thai with rice noodles, tofu, bean sprouts, and peanuts in a tangy tamarind sauce, all plant-based.',
      chefDescription: 'I want to prove that vegan food can be just as exciting and flavorful as any other cuisine. My Pad Thai is a burst of authentic Thai flavors—sweet, sour, and savory. You won’t miss the meat, I promise!',
    },
    {
      id: '5',
      name: 'Porotos Granados',
      cook: 'Maestro Lucho',
      rating: 4.8,
      reviews: 130,
      price: 6500,
      image: 'https://images.unsplash.com/photo-1688001220268-c112264a6358?q=80&w=600',
      hint: 'porotos granados chilean food',
      tags: ['Chilena', 'Vegetariano'],
      distance: 3.5,
      description: "El guiso veraniego por excelencia. Porotos frescos, maíz, zapallo y albahaca, todo cocinado lentamente.",
      chefDescription: "Este plato es el sabor del verano chileno. Uso los porotos granados más frescos que encuentro en la feria y choclo tierno para darle el dulzor justo. La albahaca fresca al final le da el toque perfecto. Es un plato simple, honesto y lleno de tradición.",
    },
    {
      id: '11',
      name: 'Margherita Pizza',
      cook: 'Chef Isabella',
      rating: 4.8,
      reviews: 210,
      price: 10500,
      image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?q=80&w=600',
      hint: 'pizza italian',
      tags: ['Italian', 'Vegetarian'],
      distance: 2.5,
      description: 'Classic Neapolitan Margherita with San Marzano tomatoes, fresh mozzarella, basil, and a drizzle of olive oil.',
      chefDescription: 'Simplicity is the ultimate sophistication. I make my dough with a 72-hour cold ferment for a light, airy crust. The best San Marzano tomatoes and fresh mozzarella are all it needs. It’s pizza as it should be.',
    },
    {
      id: '6',
      name: 'Completo Italiano',
      cook: 'El Rey del Completo',
      rating: 4.7,
      reviews: 250,
      price: 3500,
      image: 'https://images.unsplash.com/photo-1624375939226-3a7a4435cc59?q=80&w=600',
      hint: 'completo hot dog chilean',
      tags: ['Rápida', 'Chilena'],
      distance: 1.5,
      description: "El rey de la comida rápida chilena. Pan de hot dog, vienesa, tomate, palta y una generosa cantidad de mayonesa casera.",
      chefDescription: "Para hacer el mejor completo, todo tiene que ser de calidad. Mi pan es de una panadería del barrio, las vienesas son premium y la palta la muelo en el momento. Pero mi orgullo es la mayonesa casera, ¡cremosa y con el toque justo de limón! No has probado un completo de verdad hasta que pruebas el mío.",
    },
    {
      id: '12',
      name: 'BBQ Pulled Pork Sandwich',
      cook: 'Grillmaster Joe',
      rating: 4.7,
      reviews: 76,
      price: 12000,
      image: 'https://images.unsplash.com/photo-1599974511283-7a834d6199b1?q=80&w=600',
      hint: 'bbq sandwich pork',
      tags: ['American', 'BBQ'],
      distance: 1.8,
      description: 'Slow-smoked pulled pork in a tangy BBQ sauce, piled high on a toasted bun with coleslaw.',
      chefDescription: 'Patience is the secret ingredient. I smoke my pork for 12 hours over hickory wood until it’s fall-apart tender. My BBQ sauce is a family recipe that perfectly balances sweet and tangy. It’s a messy, delicious masterpiece.',
    },
];

// Sample orders data - in a real app, this would be in a database.
export const allOrders: Order[] = [
    { id: 'xyz-123', dishId: '7', quantity: 1, status: 'Order Placed', customerName: 'Alex Johnson', verificationCode: '1234' },
    { id: 'abc-456', dishId: '1', quantity: 2, status: 'Preparing Food', customerName: 'Maria Garcia', verificationCode: '5678' },
    { id: 'def-789', dishId: '8', quantity: 1, status: 'Ready for Pickup', customerName: 'Chen Wei', verificationCode: '9012' },
];

export function findOrder(orderId?: string | null): Order | undefined {
    // A real implementation would query a database.
    // For now, we find it in our static list, and add a sample if not found for demo purposes.
    if (!orderId) return undefined;
    let order = allOrders.find(o => o.id === orderId);
    if (!order) {
        // Create a temporary order for demonstration if the ID is not in our static list
        const dishId = orderId.includes('dishId=') ? orderId.split('dishId=')[1].split('&')[0] : '1';
        order = {
            id: orderId,
            dishId: dishId,
            quantity: 1,
            status: 'Order Placed',
            customerName: 'New Customer',
            verificationCode: '9999' // Dummy code for new orders
        };
    }
    return order;
}
