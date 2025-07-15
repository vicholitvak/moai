
// This file contains the static data for the app.
// In a real application, this data would likely be fetched from a database.

export interface Drink {
    name: string;
    price: number; // Price in CLP
}

export interface Dish {
    id: string;
    name: string;
    cook: string; // The name of the cook
    cookId: string; // The ID of the cook
    rating: number;
    reviews: number;
    price: number; // Price in CLP
    image: string;
    hint: string;
    tags: string[];
    distance: number;
    description: string;
    chefDescription: string;
    prepTimeMinutes: number; // Time in minutes to prepare the dish
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
    prepStartedAt?: number; // Timestamp when preparation started
    driverETA?: number; // Estimated minutes for driver to arrive
    driverId?: string; // ID of the assigned driver
    driverName?: string;
}

export interface Cook {
    id: string;
    name: string;
    isAvailable: boolean;
    location: string;
    specialties: string[];
    bio: string;
    availability: string;
}


// Start with no orders. They will be created dynamically.
export let allOrders: Order[] = [];

export function findOrder(orderId?: string | null): Order | undefined {
    if (!orderId) {
        return undefined;
    }
    return allOrders.find(o => o.id === orderId);
}

export const allCooks: Cook[] = [
    {
        id: 'cook-isabella',
        name: 'Chef Isabella',
        isAvailable: true,
        location: '123 Cook St, Santiago',
        specialties: ['Authentic Italian', 'Handmade Pasta', 'Pizza'],
        bio: "With over 15 years of experience in traditional Italian kitchens, I bring the taste of Italy to your home. My passion is fresh, locally-sourced ingredients and classic recipes passed down through generations.",
        availability: "Weekdays 6 PM - 10 PM, Weekends 12 PM - 11 PM",
    },
    {
        id: 'cook-elena',
        name: 'Doña Elena',
        isAvailable: true,
        location: '456 Chilean Way, Santiago',
        specialties: [],
        bio: '',
        availability: ''
    },
    {
        id: 'cook-lucho',
        name: 'Maestro Lucho',
        isAvailable: true,
        location: '789 Campo Ave, Santiago',
        specialties: [],
        bio: '',
        availability: ''
    },
     {
        id: 'cook-joe',
        name: 'Grillmaster Joe',
        isAvailable: false,
        location: '321 Burger Blvd, Santiago',
        specialties: [],
        bio: '',
        availability: ''
    },
];

export const allDishes: Dish[] = [
    {
      id: '1',
      name: 'Empanadas de Pino',
      cook: 'Doña Elena',
      cookId: 'cook-elena',
      rating: 4.9,
      reviews: 152,
      price: 2500,
      image: 'https://images.unsplash.com/photo-1625938135336-3b561a7a4a9b?q=80&w=600',
      hint: 'empanada chilean food',
      tags: ['Chilena', 'Clásico'],
      distance: 2.1,
      description: "La empanada de pino tradicional, horneada a la perfección con un relleno jugoso de carne, cebolla, huevo y aceituna.",
      chefDescription: "Cada empanada que hago lleva la receta de mi abuela. Uso solo los mejores ingredientes locales para el pino, y la masa es amasada a mano cada mañana. Es el sabor de la celebración y la familia chilena, directamente desde mi horno a su mesa. ¡Espero que les guste!",
      prepTimeMinutes: 20,
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
      cookId: 'cook-lucho',
      rating: 4.8,
      reviews: 112,
      price: 7500,
      image: 'https://images.unsplash.com/photo-1688001220443-0c46b14a28f7?q=80&w=600',
      hint: 'pastel de choclo chilean',
      tags: ['Chilena', 'Casero'],
      distance: 3.5,
      description: "Un clásico pastel de choclo con una suave cubierta de maíz y un sabroso relleno de pino de carne, pollo y huevo.",
      chefDescription: "Mi secreto está en el choclo humero, que muelo fresco para obtener esa dulzura y cremosidad únicas. El pino lo cocino a fuego lento por horas para que todos los sabores se unan. Es un plato que me recuerda mi infancia en el campo, y me encanta compartirlo.",
      prepTimeMinutes: 30,
    },
    {
      id: '7',
      name: 'Spaghetti Carbonara',
      cook: 'Chef Isabella',
      cookId: 'cook-isabella',
      rating: 4.9,
      reviews: 132,
      price: 12500,
      image: 'https://images.unsplash.com/photo-1588013273468-31508b946d4d?q=80&w=600',
      hint: 'pasta italian food',
      tags: ['Italian', 'Classic'],
      distance: 2.5,
      description: 'Authentic Spaghetti Carbonara with crispy guanciale, pecorino romano, and a creamy egg yolk sauce.',
      chefDescription: "This isn't your average carbonara. I use a recipe I learned in Rome, with imported guanciale and Pecorino Romano cheese. No cream, just the rich, authentic flavor of Italy in every bite. It's my signature dish for a reason!",
      prepTimeMinutes: 15,
      suggestedDrinks: [
        {name: 'Chianti Classico', price: 8000},
        {name: 'San Pellegrino', price: 2500},
      ],
    },
    {
      id: '8',
      name: 'Gourmet Burger & Fries',
      cook: 'Grillmaster Joe',
      cookId: 'cook-joe',
      rating: 4.8,
      reviews: 98,
      price: 11000,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
      hint: 'burger fries',
      tags: ['American', 'Comfort Food'],
      distance: 1.8,
      description: 'Juicy beef patty with aged cheddar, special sauce, and all the fixings, served with crispy hand-cut fries.',
      chefDescription: 'I believe a burger can be a work of art. I grind my own beef blend daily, bake my own brioche buns, and my special sauce recipe is a closely guarded secret. It’s the burger you dream about.',
      prepTimeMinutes: 18,
    },
    {
      id: '3',
      name: 'Cazuela de Vacuno',
      cook: 'Doña Elena',
      cookId: 'cook-elena',
      rating: 4.9,
      reviews: 180,
      price: 6900,
      image: 'https://images.unsplash.com/photo-1688001220421-a70d12ec32c3?q=80&w=600',
      hint: 'cazuela soup chilean',
      tags: ['Chilena', 'Sopa'],
      distance: 2.1,
      description: "Una contundente y sabrosa sopa de vacuno con papas, zapallo, choclo y un toque de cilantro fresco.",
      chefDescription: "No hay nada como una buena cazuela para reponer el alma. La mía es como la que hacía mi mamá: con un caldo lleno de sabor, verduras frescas de la vega y carne que se desarma en la boca. Es el plato perfecto para un día de frío o cuando necesitas un abrazo en forma de comida.",
      prepTimeMinutes: 45,
      suggestedDrinks: [
          { name: 'Ensalada Chilena', price: 1500 },
          { name: 'Jugo de Frambuesa Natural', price: 2000 },
      ]
    },
    {
      id: '11',
      name: 'Margherita Pizza',
      cook: 'Chef Isabella',
      cookId: 'cook-isabella',
      rating: 4.8,
      reviews: 210,
      price: 10500,
      image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?q=80&w=600',
      hint: 'pizza italian',
      tags: ['Italian', 'Vegetarian'],
      distance: 2.5,
      description: 'Classic Neapolitan Margherita with San Marzano tomatoes, fresh mozzarella, basil, and a drizzle of olive oil.',
      chefDescription: 'Simplicity is the ultimate sophistication. I make my dough with a 72-hour cold ferment for a light, airy crust. The best San Marzano tomatoes and fresh mozzarella are all it needs. It’s pizza as it should be.',
      prepTimeMinutes: 22,
    },
    {
      id: '6',
      name: 'Completo Italiano',
      cook: 'Maestro Lucho',
      cookId: 'cook-lucho',
      rating: 4.7,
      reviews: 250,
      price: 3500,
      image: 'https://images.unsplash.com/photo-1624375939226-3a7a4435cc59?q=80&w=600',
      hint: 'completo hot dog chilean',
      tags: ['Rápida', 'Chilena'],
      distance: 1.5,
      description: "El rey de la comida rápida chilena. Pan de hot dog, vienesa, tomate, palta y una generosa cantidad de mayonesa casera.",
      chefDescription: "Para hacer el mejor completo, todo tiene que ser de calidad. Mi pan es de una panadería del barrio, las vienesas son premium y la palta la muelo en el momento. Pero mi orgullo es la mayonesa casera, ¡cremosa y con el toque justo de limón! No has probado un completo de verdad hasta que pruebas el mío.",
      prepTimeMinutes: 5,
    },
    {
      id: '12',
      name: 'BBQ Pulled Pork Sandwich',
      cook: 'Grillmaster Joe',
      cookId: 'cook-joe',
      rating: 4.7,
      reviews: 76,
      price: 12000,
      image: 'https://images.unsplash.com/photo-1599974511283-7a834d4d6199b1?q=80&w=600',
      hint: 'bbq sandwich pork',
      tags: ['American', 'BBQ'],
      distance: 1.8,
      description: 'Slow-smoked pulled pork in a tangy BBQ sauce, piled high on a toasted bun with coleslaw.',
      chefDescription: 'Patience is the secret ingredient. I smoke my pork for 12 hours over hickory wood until it’s fall-apart tender. My BBQ sauce is a family recipe that perfectly balances sweet and tangy. It’s a messy, delicious masterpiece.',
      prepTimeMinutes: 25,
    },
];
