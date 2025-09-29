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
  ]
};