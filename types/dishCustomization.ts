/**
 * Dish Customization Types
 * Sistema de personalización de platos estilo Pedidos Ya
 */

export type OptionSelectionType = 'single' | 'multiple';

export interface CustomizationOption {
  id: string;
  name: string;
  price: number; // Precio adicional (0 si no tiene costo extra)
  available: boolean;
  imageUrl?: string;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  selectionType: OptionSelectionType; // single = radio, multiple = checkbox
  minSelections?: number; // Para multiple: mínimo a seleccionar
  maxSelections?: number; // Para multiple: máximo a seleccionar
  options: CustomizationOption[];
}

export interface DishCustomization {
  enabled: boolean;
  groups: CustomizationGroup[];
}

export interface CustomerSelection {
  groupId: string;
  selectedOptions: string[]; // IDs de las opciones seleccionadas
}

export interface CustomizedDishOrder {
  dishId: string;
  dishName: string;
  basePrice: number;
  selections: CustomerSelection[];
  totalPrice: number;
  quantity: number;
  specialInstructions?: string;
}

// Ejemplos de grupos de customización predefinidos para diferentes tipos de comida

export const PRESET_CUSTOMIZATION_GROUPS = {
  // Para wraps, tacos, burritos
  wraps: [
    {
      name: 'Tipo de Tortilla',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Tortilla de Trigo Integral', price: 0 },
        { name: 'Tortilla Blanca', price: 0 },
        { name: 'Tortilla de Espinaca', price: 500 },
        { name: 'Tortilla Sin Gluten', price: 800 }
      ]
    },
    {
      name: 'Escoge la Base',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Pollo Grillado', price: 0 },
        { name: 'Carne Mechada', price: 500 },
        { name: 'Falafel', price: 0 },
        { name: 'Tofu', price: 300 }
      ]
    },
    {
      name: 'Escoge Granos',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 2,
      options: [
        { name: 'Arroz Integral', price: 0 },
        { name: 'Quinoa', price: 500 },
        { name: 'Lentejas', price: 300 },
        { name: 'Frijoles Negros', price: 0 }
      ]
    },
    {
      name: 'Escoge Verduras',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 4,
      options: [
        { name: 'Lechuga', price: 0 },
        { name: 'Tomate', price: 0 },
        { name: 'Cebolla Morada', price: 0 },
        { name: 'Palta', price: 800 },
        { name: 'Pepino', price: 0 },
        { name: 'Zanahoria', price: 0 }
      ]
    },
    {
      name: 'Escoge Toppings',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 3,
      options: [
        { name: 'Queso Cheddar', price: 500 },
        { name: 'Guacamole', price: 800 },
        { name: 'Salsa Chimichurri', price: 300 },
        { name: 'Salsa de Yogurt', price: 300 },
        { name: 'Jalapeños', price: 200 }
      ]
    }
  ],

  // Para sushi
  sushi: [
    {
      name: 'Tipo de Roll',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Roll Tradicional (Nori Afuera)', price: 0 },
        { name: 'Roll Invertido (Arroz Afuera)', price: 500 },
        { name: 'Temaki (Cono)', price: 300 }
      ]
    },
    {
      name: 'Proteína Principal',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Salmón', price: 0 },
        { name: 'Atún', price: 800 },
        { name: 'Camarón', price: 600 },
        { name: 'Pulpo', price: 700 },
        { name: 'Pollo Teriyaki', price: -500 },
        { name: 'Vegetariano', price: -800 }
      ]
    },
    {
      name: 'Ingredientes Adicionales',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 3,
      options: [
        { name: 'Palta', price: 500 },
        { name: 'Queso Philadelphia', price: 400 },
        { name: 'Pepino', price: 0 },
        { name: 'Cebollín', price: 0 },
        { name: 'Sésamo', price: 0 }
      ]
    },
    {
      name: 'Toppings Especiales',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 2,
      options: [
        { name: 'Tempura Crunch', price: 600 },
        { name: 'Tobiko (Huevas)', price: 800 },
        { name: 'Anguila Teriyaki', price: 1000 },
        { name: 'Spicy Mayo', price: 300 }
      ]
    }
  ],

  // Para hamburguesas
  burgers: [
    {
      name: 'Punto de la Carne',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Jugoso', price: 0 },
        { name: 'Término Medio', price: 0 },
        { name: 'Bien Cocido', price: 0 }
      ]
    },
    {
      name: 'Tipo de Pan',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Pan Brioche', price: 0 },
        { name: 'Pan Integral', price: 0 },
        { name: 'Pan Sin Gluten', price: 800 },
        { name: 'Lechuga (Sin Pan)', price: 0 }
      ]
    },
    {
      name: 'Quesos',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 2,
      options: [
        { name: 'Cheddar', price: 500 },
        { name: 'Queso Azul', price: 800 },
        { name: 'Suizo', price: 600 },
        { name: 'Provolone', price: 500 }
      ]
    },
    {
      name: 'Extras',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 4,
      options: [
        { name: 'Tocino', price: 800 },
        { name: 'Huevo Frito', price: 500 },
        { name: 'Cebolla Caramelizada', price: 400 },
        { name: 'Champiñones', price: 600 },
        { name: 'Jalapeños', price: 300 },
        { name: 'Palta', price: 700 }
      ]
    }
  ],

  // Para pizzas
  pizza: [
    {
      name: 'Tamaño',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Personal (6")', price: -2000 },
        { name: 'Mediana (10")', price: 0 },
        { name: 'Familiar (14")', price: 3000 }
      ]
    },
    {
      name: 'Tipo de Masa',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Masa Tradicional', price: 0 },
        { name: 'Masa Delgada', price: 0 },
        { name: 'Masa Gruesa', price: 500 },
        { name: 'Masa Integral', price: 800 }
      ]
    },
    {
      name: 'Ingredientes Extra',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      options: [
        { name: 'Pepperoni', price: 800 },
        { name: 'Jamón', price: 600 },
        { name: 'Champiñones', price: 500 },
        { name: 'Aceitunas', price: 400 },
        { name: 'Pimentón', price: 400 },
        { name: 'Cebolla', price: 300 },
        { name: 'Piña', price: 500 },
        { name: 'Queso Extra', price: 700 }
      ]
    }
  ],

  // Para popcorn
  popcorn: [
    {
      name: 'Sabor',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Caramelo', price: 0 },
        { name: 'Mantequilla Sal', price: 0 },
        { name: 'Mantequilla Merkén', price: 0 },
        { name: 'Blue Raspberry', price: 0 },
        { name: 'Canela', price: 0 },
        { name: 'Chocolate', price: 0 },
        { name: 'Caramelo Coco', price: 1000 },
        { name: 'Chocolate Coco', price: 1000 }
      ]
    }
  ],

  // Para choclitos
  choclitos: [
    {
      name: 'Base de Mantequilla',
      required: false,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Merkén', price: 0 },
        { name: 'Orégano', price: 0 },
        { name: 'Pimentón', price: 0 },
        { name: 'Sin base', price: 0 }
      ]
    },
    {
      name: 'Primera Salsa',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Aceituna', price: 0 },
        { name: 'Albahaca', price: 0 },
        { name: 'Ciboullette', price: 0 },
        { name: 'Cilantro', price: 0 },
        { name: 'Cheddar', price: 0 },
        { name: 'Huancaina', price: 0 },
        { name: 'Tari', price: 0 },
        { name: 'Inferno Jalapeño', price: 0 },
        { name: 'Salsa Spicy', price: 0 },
        { name: 'Ají Chipotle', price: 0 },
        { name: 'Golden (BBQ, mostaza y miel)', price: 0 },
        { name: 'Mostaza Miel', price: 0 },
        { name: 'BBQ', price: 0 },
        { name: 'Salsa Secreta', price: 0 },
        { name: 'NotCo Mayo', price: 0 },
        { name: 'NotCo Mayo Ají', price: 0 },
        { name: 'NotCo Special Sauce', price: 0 },
        { name: 'NotCo Mayo Doritos', price: 0 },
        { name: 'NotCo Mayo Oliva', price: 0 }
      ]
    },
    {
      name: 'Segunda Salsa (Opcional)',
      required: false,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Sin segunda salsa', price: 0 },
        { name: 'Aceituna', price: 2000 },
        { name: 'Albahaca', price: 2000 },
        { name: 'Ciboullette', price: 2000 },
        { name: 'Cilantro', price: 2000 },
        { name: 'Cheddar', price: 2000 },
        { name: 'Huancaina', price: 2000 },
        { name: 'Tari', price: 2000 },
        { name: 'Inferno Jalapeño', price: 2000 },
        { name: 'Salsa Spicy', price: 2000 },
        { name: 'Ají Chipotle', price: 2000 },
        { name: 'Golden', price: 2000 },
        { name: 'Mostaza Miel', price: 2000 },
        { name: 'BBQ', price: 2000 },
        { name: 'Salsa Secreta', price: 2000 },
        { name: 'NotCo Mayo', price: 2000 },
        { name: 'NotCo Mayo Ají', price: 2000 },
        { name: 'NotCo Special Sauce', price: 2000 },
        { name: 'NotCo Mayo Doritos', price: 2000 },
        { name: 'NotCo Mayo Oliva', price: 2000 }
      ]
    },
    {
      name: 'Primer Topping',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Guacamole', price: 0 },
        { name: 'Pebre', price: 0 },
        { name: 'Papas Hilo', price: 0 },
        { name: 'Choclo', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Aceituna', price: 0 },
        { name: 'Pepinillos', price: 0 },
        { name: 'Tomate', price: 0 },
        { name: 'Cebolla Crispy', price: 0 },
        { name: 'Cebolla Caramelizada', price: 0 },
        { name: 'Chucrut', price: 0 },
        { name: 'Salsa Verde', price: 0 },
        { name: 'Queso Llanero', price: 0 },
        { name: 'Queso de Cabra', price: 0 },
        { name: 'Porotos Refritos', price: 0 },
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nueces', price: 0 },
        { name: 'Ají Verde', price: 0 },
        { name: 'Cilantro', price: 0 },
        { name: 'Cebollín', price: 0 },
        { name: 'Sweet Relish', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 }
      ]
    },
    {
      name: 'Segundo Topping (Opcional)',
      required: false,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Sin segundo topping', price: 0 },
        { name: 'Guacamole', price: 1000 },
        { name: 'Pebre', price: 1000 },
        { name: 'Papas Hilo', price: 1000 },
        { name: 'Choclo', price: 1000 },
        { name: 'Jalapeño', price: 1000 },
        { name: 'Aceituna', price: 1000 },
        { name: 'Pepinillos', price: 1000 },
        { name: 'Tomate', price: 1000 },
        { name: 'Cebolla Crispy', price: 1000 },
        { name: 'Cebolla Caramelizada', price: 1000 },
        { name: 'Chucrut', price: 1000 },
        { name: 'Salsa Verde', price: 1000 },
        { name: 'Queso Llanero', price: 1000 },
        { name: 'Queso de Cabra', price: 1000 },
        { name: 'Porotos Refritos', price: 1000 },
        { name: 'Maní', price: 1000 },
        { name: 'Almendras', price: 1000 },
        { name: 'Nueces', price: 1000 },
        { name: 'Ají Verde', price: 1000 },
        { name: 'Cilantro', price: 1000 },
        { name: 'Cebollín', price: 1000 },
        { name: 'Sweet Relish', price: 1000 },
        { name: 'Takis', price: 1000 },
        { name: 'Doritos', price: 1000 }
      ]
    }
  ],

  // Para sopapillas
  sopapillas: [
    {
      name: 'Estilo',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Clásicas (ketchup, mayo, mostaza)', price: 0 },
        { name: 'A la Chilena (con pebre)', price: 1000 },
        { name: 'Mexicanas (con guacamole)', price: 2000 },
        { name: 'Dulces (con manjar)', price: 1000 },
        { name: 'Salseras (con 2 salsas a elección)', price: 2000 }
      ]
    },
    {
      name: 'Salsa Extra 1 (solo para Salseras)',
      required: false,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'N/A', price: 0 },
        { name: 'Aceituna', price: 0 },
        { name: 'Albahaca', price: 0 },
        { name: 'Ciboullette', price: 0 },
        { name: 'Cilantro', price: 0 },
        { name: 'Cheddar', price: 0 },
        { name: 'Huancaina', price: 0 },
        { name: 'Tari', price: 0 },
        { name: 'Inferno Jalapeño', price: 0 },
        { name: 'Salsa Spicy', price: 0 }
      ]
    },
    {
      name: 'Salsa Extra 2 (solo para Salseras)',
      required: false,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'N/A', price: 0 },
        { name: 'BBQ', price: 0 },
        { name: 'Mostaza Miel', price: 0 },
        { name: 'NotCo Mayo', price: 0 },
        { name: 'NotCo Mayo Ají', price: 0 },
        { name: 'Tártara', price: 0 },
        { name: 'Ají Crema', price: 0 },
        { name: 'Mayo Deli', price: 0 }
      ]
    }
  ],

  // Para armar rolls (sushi)
  armaturoll: [
    {
      name: 'Proteína',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Salmón', price: 0 },
        { name: 'Camarón', price: 0 },
        { name: 'Kanikama', price: -2000 },
        { name: 'Pollo', price: -1000 },
        { name: 'Atún', price: 0 },
        { name: 'Seitán', price: -2000 },
        { name: 'Champiñón', price: -1000 },
        { name: 'Tofu', price: -1000 }
      ]
    },
    {
      name: 'Envoltura',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Sésamo Tostado', price: 0 },
        { name: 'Nori', price: 0 },
        { name: 'Anguila', price: 0 },
        { name: 'Zanahoria', price: 0 },
        { name: 'Panko', price: 0 }
      ]
    },
    {
      name: 'Envoltura Premium (Opcional)',
      required: false,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Sin envoltura premium', price: 0 },
        { name: 'Salmón', price: 1500 },
        { name: 'Palta', price: 1500 },
        { name: 'Queso Crema', price: 1500 },
        { name: 'Mango', price: 1500 },
        { name: 'Jamón Serrano', price: 1500 }
      ]
    },
    {
      name: 'Verduras',
      required: true,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 3,
      options: [
        { name: 'Pepino', price: 0 },
        { name: 'Cebolla', price: 0 },
        { name: 'Zucchini Furay', price: 0 },
        { name: 'Zanahoria', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Aceituna', price: 0 },
        { name: 'Palmito', price: 0 },
        { name: 'Apio', price: 0 },
        { name: 'Pepinillo', price: 0 },
        { name: 'Ají Verde', price: 0 },
        { name: 'Papa Camote', price: 0 },
        { name: 'Espárragos', price: 0 }
      ]
    },
    {
      name: 'Toppings',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 2,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla Crispy', price: 0 },
        { name: 'Salsa Verde', price: 0 },
        { name: 'Cebolla Caramelizada', price: 0 },
        { name: 'Queso Rallado', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco Rallado', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Salsa Spicy', price: 0 },
        { name: 'Sweet Relish', price: 0 },
        { name: 'Papas Hilo', price: 0 },
        { name: 'Salsa de Cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de Aceitunas', price: 0 },
        { name: 'Tártara', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Acevichada Vegan', price: 0 }
      ]
    }
  ],

  // Para gohan (bowls de arroz)
  gohan: [
    {
      name: 'Proteína',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Salmón', price: 0 },
        { name: 'Camarón', price: 0 },
        { name: 'Kanikama', price: -2000 },
        { name: 'Pollo', price: -1000 },
        { name: 'Atún', price: 0 },
        { name: 'Seitán', price: -2000 },
        { name: 'Champiñón', price: -1000 },
        { name: 'Tofu', price: -1000 }
      ]
    },
    {
      name: 'Verduras (Elige 2)',
      required: true,
      selectionType: 'multiple' as OptionSelectionType,
      minSelections: 2,
      maxSelections: 2,
      options: [
        { name: 'Pepino', price: 0 },
        { name: 'Zanahoria', price: 0 },
        { name: 'Cebolla', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Aceituna', price: 0 },
        { name: 'Tomate', price: 0 },
        { name: 'Palmito', price: 0 },
        { name: 'Choclo', price: 0 }
      ]
    },
    {
      name: 'Topping',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla Crispy', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco Rallado', price: 0 },
        { name: 'Cebolla Caramelizada', price: 0 },
        { name: 'Salsa de Cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de Aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Tártara', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Sweet Relish', price: 0 },
        { name: 'Papas Hilo', price: 0 },
        { name: 'Salsa Spicy', price: 0 },
        { name: 'Salsa Verde', price: 0 },
        { name: 'Cebollín', price: 0 }
      ]
    }
  ],

  // Para tacos
  tacos: [
    {
      name: 'Proteína',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Cerdo', price: 0 },
        { name: 'Vacuno', price: 0 },
        { name: 'Champiñón', price: -1000 },
        { name: 'Seitán', price: -2000 },
        { name: 'Carne de Soya', price: -2000 }
      ]
    },
    {
      name: 'Tortilla',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Clásica', price: 0 },
        { name: 'Tomate Albahaca', price: 0 },
        { name: 'Chía Linaza', price: 0 }
      ]
    },
    {
      name: 'Verduras',
      required: true,
      selectionType: 'multiple' as OptionSelectionType,
      maxSelections: 3,
      options: [
        { name: 'Lechuga', price: 0 },
        { name: 'Pepino', price: 0 },
        { name: 'Zuccini', price: 0 },
        { name: 'Zanahoria', price: 0 },
        { name: 'Apio', price: 0 },
        { name: 'Choclo', price: 0 },
        { name: 'Mango', price: 0 },
        { name: 'Aceituna', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Pepinillo', price: 0 },
        { name: 'Pimentón', price: 0 },
        { name: 'Palmito', price: 0 },
        { name: 'Cebolla', price: 0 },
        { name: 'Tomate', price: 0 }
      ]
    },
    {
      name: 'Salsa',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Aceituna', price: 0 },
        { name: 'Albahaca', price: 0 },
        { name: 'Ciboullette', price: 0 },
        { name: 'Cilantro', price: 0 },
        { name: 'Cheddar', price: 0 },
        { name: 'Huancaina', price: 0 },
        { name: 'Tari', price: 0 },
        { name: 'Inferno Jalapeño', price: 0 },
        { name: 'Salsa de Ajo', price: 0 },
        { name: 'Ají Chipotle', price: 0 },
        { name: 'Golden (BBQ, mostaza y miel)', price: 0 },
        { name: 'Mostaza Miel', price: 0 },
        { name: 'BBQ', price: 0 },
        { name: 'Salsa Secreta', price: 0 },
        { name: 'NotCo Mayo', price: 0 },
        { name: 'NotCo Mayo Ají', price: 0 },
        { name: 'NotCo Mayo Doritos', price: 0 },
        { name: 'NotCo Mayo Oliva', price: 0 },
        { name: 'Salsa Spicy', price: 0 },
        { name: 'NotCo Special Sauce', price: 0 }
      ]
    },
    {
      name: 'Topping',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Guacamole', price: 0 },
        { name: 'Pebre', price: 0 },
        { name: 'Papas Hilo', price: 0 },
        { name: 'Cebolla Crispy', price: 0 },
        { name: 'Chucrut', price: 0 },
        { name: 'Salsa Verde', price: 0 },
        { name: 'Tocino', price: 0 },
        { name: 'Cebolla Caramelizada', price: 0 },
        { name: 'Queso Llanero', price: 0 },
        { name: 'Queso Cabra', price: 0 },
        { name: 'Porotos Refritos', price: 0 },
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nueces', price: 0 },
        { name: 'Ají Verde', price: 0 },
        { name: 'Cilantro', price: 0 },
        { name: 'Cebollín', price: 0 },
        { name: 'Sweet Relish', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 }
      ]
    }
  ],

  // Para ensaladas
  salads: [
    {
      name: 'Base de la Ensalada',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Mix de Lechugas', price: 0 },
        { name: 'Espinaca', price: 0 },
        { name: 'Rúcula', price: 300 },
        { name: 'Kale', price: 500 }
      ]
    },
    {
      name: 'Proteína',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Pollo Grillado', price: 0 },
        { name: 'Salmón', price: 2000 },
        { name: 'Camarones', price: 1500 },
        { name: 'Tofu', price: 500 },
        { name: 'Sin Proteína', price: -1000 }
      ]
    },
    {
      name: 'Vegetales y Extras',
      required: false,
      selectionType: 'multiple' as OptionSelectionType,
      options: [
        { name: 'Tomate Cherry', price: 0 },
        { name: 'Pepino', price: 0 },
        { name: 'Palta', price: 800 },
        { name: 'Zanahoria', price: 0 },
        { name: 'Queso Feta', price: 600 },
        { name: 'Nueces', price: 500 },
        { name: 'Crutones', price: 300 }
      ]
    },
    {
      name: 'Aderezo',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Vinagreta Balsámica', price: 0 },
        { name: 'Caesar', price: 0 },
        { name: 'Miel Mostaza', price: 0 },
        { name: 'Yogurt Limón', price: 0 }
      ]
    }
  ],

  // Tablas de Sushi
  tabla1: [
    {
      name: 'Topping Roll 1 (Avocado Roll: Camarón, queso crema y ciboullette)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 2 (Panko Roll: Pollo Teriyaki, queso crema y cebollín)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 3 (Hosomaki: Kanikama y queso crema)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    }
  ],

  tabla2: [
    {
      name: 'Topping Roll 1 (Panko: Camarón, queso crema y palta)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 2 (Panko: Pollo Teriyaki, queso crema y cebollín)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 3 (Panko: Salmón, queso crema, cebollín)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    }
  ],

  tabla3: [
    {
      name: 'Topping Roll 1 (Avocado: Camarón, queso crema y ciboullette)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 2 (Hosomaki: Palta, queso crema)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 3 (California: Pollo Teriyaki, queso crema, cebollín)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 4 (Panko: Salmón, queso crema, cebollín)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 },
        { name: 'Tartara', price: 0 }
      ]
    }
  ],

  tabla4vegan: [
    {
      name: 'Topping Roll 1 (Panko: Maní, queso crema, cebollín)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 2 (California: Seitán, queso crema, ciboullette)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 3 (Hosomaki: Champiñón, queso crema)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 }
      ]
    }
  ],

  tabla5vegan: [
    {
      name: 'Topping Roll 1 (Panko: Maní, queso crema, cebollín)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 2 (California: Seitán, queso crema, ciboullette)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 3 (Avocado: Zuccini furay, mango)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 }
      ]
    },
    {
      name: 'Topping Roll 4 (Hosomaki: Champiñón, queso crema)',
      required: true,
      selectionType: 'single' as OptionSelectionType,
      options: [
        { name: 'Maní', price: 0 },
        { name: 'Almendras', price: 0 },
        { name: 'Nuez', price: 0 },
        { name: 'Cebolla crispy', price: 0 },
        { name: 'Salsa verde', price: 0 },
        { name: 'Cebolla caramelizada', price: 0 },
        { name: 'Jalapeño', price: 0 },
        { name: 'Merkén', price: 0 },
        { name: 'Coco rallado', price: 0 },
        { name: 'Semillas de amapola', price: 0 },
        { name: 'Siracha', price: 0 },
        { name: 'Papas hilo', price: 0 },
        { name: 'Salsa de cilantro', price: 0 },
        { name: 'Salsa Albahaca', price: 0 },
        { name: 'Salsa Ciboullette', price: 0 },
        { name: 'Salsa de aceitunas', price: 0 },
        { name: 'Takis', price: 0 },
        { name: 'Doritos', price: 0 },
        { name: 'Sweet relish', price: 0 },
        { name: 'Acevichada Vegan', price: 0 }
      ]
    }
  ]
};