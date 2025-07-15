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
];
