'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  CustomizationGroup,
  CustomerSelection,
  CustomizedDishOrder,
  DishCustomization
} from '@/types/dishCustomization';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface DishCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: {
    id: string;
    name: string;
    image: string;
    price: number;
    cookerId: string;
    customization?: DishCustomization;
  };
  onAddToCart: (order: CustomizedDishOrder) => void;
  onAddComplementToCart?: (item: any) => void;
}

export function DishCustomizationModal({
  isOpen,
  onClose,
  dish,
  onAddToCart,
  onAddComplementToCart
}: DishCustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<CustomerSelection[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [complements, setComplements] = useState<any[]>([]);
  const [loadingComplements, setLoadingComplements] = useState(true);

  useEffect(() => {
    if (isOpen && dish.customization?.enabled) {
      // Inicializar selections vacías
      const initialSelections: CustomerSelection[] = dish.customization.groups.map(group => ({
        groupId: group.id,
        selectedOptions: []
      }));
      setSelections(initialSelections);
      setValidationErrors([]);
      setQuantity(1);
      setSpecialInstructions('');
    }
  }, [isOpen, dish]);

  // Cargar complementos del mismo cocinero
  useEffect(() => {
    const fetchComplements = async () => {
      if (!isOpen || !dish.cookerId) {
        console.log('❌ No cargar complementos:', { isOpen, cookerId: dish.cookerId });
        return;
      }

      console.log('🔍 Cargando complementos para cookerId:', dish.cookerId);
      setLoadingComplements(true);
      try {
        const dishesRef = collection(db, 'dishes');
        const q = query(
          dishesRef,
          where('cookerId', '==', dish.cookerId),
          where('isAvailable', '==', true)
        );

        const snapshot = await getDocs(q);
        console.log('📦 Total platos encontrados:', snapshot.docs.length);

        const allDishes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtrar todos los platos excepto el actual
        const complementDishes = allDishes.filter((d: any) => d.id !== dish.id);

        console.log('✅ Complementos filtrados:', complementDishes.length);
        console.log('🍽️  Complementos:', complementDishes.map(d => d.name));

        setComplements(complementDishes);
      } catch (error) {
        console.error('❌ Error cargando complementos:', error);
      } finally {
        setLoadingComplements(false);
      }
    };

    fetchComplements();
  }, [isOpen, dish.cookerId, dish.id]);

  const handleOptionSelect = (groupId: string, optionId: string, group: CustomizationGroup) => {
    setSelections(prev => {
      const newSelections = [...prev];
      const selectionIndex = newSelections.findIndex(s => s.groupId === groupId);

      if (selectionIndex === -1) return prev;

      const currentSelection = newSelections[selectionIndex];

      if (group.selectionType === 'single') {
        // Radio button behavior: solo una opción
        currentSelection.selectedOptions = [optionId];
      } else {
        // Checkbox behavior: múltiples opciones
        const isSelected = currentSelection.selectedOptions.includes(optionId);

        if (isSelected) {
          // Deseleccionar
          currentSelection.selectedOptions = currentSelection.selectedOptions.filter(
            id => id !== optionId
          );
        } else {
          // Seleccionar si no excede el máximo
          if (group.maxSelections && currentSelection.selectedOptions.length >= group.maxSelections) {
            toast.warning(`Solo puedes seleccionar hasta ${group.maxSelections} opciones`);
            return prev;
          }
          currentSelection.selectedOptions = [...currentSelection.selectedOptions, optionId];
        }
      }

      return newSelections;
    });
  };

  const isOptionSelected = (groupId: string, optionId: string): boolean => {
    const selection = selections.find(s => s.groupId === groupId);
    return selection?.selectedOptions.includes(optionId) || false;
  };

  const calculateTotalPrice = (): number => {
    if (!dish.customization?.enabled) return dish.price * quantity;

    let additionalPrice = 0;

    selections.forEach(selection => {
      const group = dish.customization!.groups.find(g => g.id === selection.groupId);
      if (!group) return;

      selection.selectedOptions.forEach(optionId => {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          additionalPrice += option.price;
        }
      });
    });

    return (dish.price + additionalPrice) * quantity;
  };

  const validateSelections = (): boolean => {
    if (!dish.customization?.enabled) return true;

    const errors: string[] = [];

    dish.customization.groups.forEach(group => {
      const selection = selections.find(s => s.groupId === group.id);
      const selectedCount = selection?.selectedOptions.length || 0;

      if (group.required && selectedCount === 0) {
        errors.push(`Debes seleccionar al menos una opción en "${group.name}"`);
      }

      if (group.minSelections && selectedCount < group.minSelections) {
        errors.push(`Debes seleccionar al menos ${group.minSelections} opciones en "${group.name}"`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddToCart = () => {
    if (!validateSelections()) {
      toast.error('Por favor completa todas las opciones requeridas');
      return;
    }

    const order: CustomizedDishOrder = {
      dishId: dish.id,
      dishName: dish.name,
      basePrice: dish.price,
      selections,
      totalPrice: calculateTotalPrice(),
      quantity,
      specialInstructions: specialInstructions.trim() || undefined
    };

    onAddToCart(order);
    toast.success('¡Plato agregado al carrito!');
    onClose();
  };

  const isAddToCartEnabled = (): boolean => {
    if (!dish.customization?.enabled) return true;

    // Verificar que todos los grupos requeridos tengan selecciones
    return dish.customization.groups.every(group => {
      const selection = selections.find(s => s.groupId === group.id);
      const selectedCount = selection?.selectedOptions.length || 0;

      if (group.required && selectedCount === 0) {
        return false;
      }

      if (group.minSelections && selectedCount < group.minSelections) {
        return false;
      }

      return true;
    });
  };

  if (!isOpen) return null;

  const totalPrice = calculateTotalPrice();
  const canAddToCart = isAddToCartEnabled();

  return (
    <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header con imagen */}
        <div className="relative h-48 sm:h-64 w-full shrink-0">
          <Image
            src={dish.image}
            alt={dish.name}
            fill
            className="object-cover"
            priority
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Content con scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Título y precio base */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {dish.name}
              </h2>
              <p className="text-lg text-gray-600">
                Precio base: ${dish.price.toLocaleString('es-CL')}
              </p>
            </div>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">Opciones requeridas:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Grupos de customización */}
            {dish.customization?.enabled && (
              <div className="space-y-6 mb-6">
                {dish.customization.groups.map((group) => {
                  const selection = selections.find(s => s.groupId === group.id);
                  const selectedCount = selection?.selectedOptions.length || 0;

                  return (
                    <div key={group.id} className="border-b border-gray-200 pb-6 last:border-0">
                      {/* Group header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            {group.name}
                            {group.required && (
                              <Badge variant="destructive" className="text-xs">
                                Requerido
                              </Badge>
                            )}
                          </h3>
                          {group.description && (
                            <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                          )}
                          {group.selectionType === 'multiple' && (
                            <p className="text-xs text-gray-500 mt-1">
                              {group.minSelections && `Mínimo ${group.minSelections} • `}
                              {group.maxSelections && `Máximo ${group.maxSelections} opciones`}
                              {selectedCount > 0 && ` • ${selectedCount} seleccionadas`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {group.options.map((option) => {
                          const isSelected = isOptionSelected(group.id, option.id);
                          const isDisabled = !option.available;

                          return (
                            <button
                              key={option.id}
                              onClick={() => !isDisabled && handleOptionSelect(group.id, option.id, group)}
                              disabled={isDisabled}
                              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'border-atacama-orange bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {/* Radio/Checkbox indicator */}
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    group.selectionType === 'single' ? 'rounded-full' : 'rounded'
                                  } ${
                                    isSelected
                                      ? 'border-atacama-orange bg-atacama-orange'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>

                                <div className="text-left flex-1">
                                  <div className="font-medium text-gray-900">{option.name}</div>
                                  {!option.available && (
                                    <div className="text-xs text-red-600 mt-0.5">No disponible</div>
                                  )}
                                </div>
                              </div>

                              {option.price !== 0 && (
                                <div className="text-sm font-semibold text-gray-900 ml-2">
                                  {option.price > 0 ? '+' : ''}${option.price.toLocaleString('es-CL')}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Instrucciones especiales */}
            <div className="mb-6">
              <Label htmlFor="instructions" className="text-base font-semibold mb-2 block">
                Instrucciones Especiales (Opcional)
              </Label>
              <Textarea
                id="instructions"
                placeholder="Ej: Sin cebolla, extra picante, etc..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Complementos del mismo cocinero */}
            {complements.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ¿Quieres agregar algo más?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Otros platos disponibles del menú
                </p>
                <div className="space-y-6">
                  {/* Agrupar por categoría */}
                  {Object.entries(
                    complements.reduce((acc: any, complement: any) => {
                      const category = complement.category || 'Otros';
                      if (!acc[category]) {
                        acc[category] = [];
                      }
                      acc[category].push(complement);
                      return acc;
                    }, {})
                  ).map(([category, items]: [string, any]) => (
                    <div key={category}>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-lg">
                          {category === 'Bebidas' ? '🥤' :
                           category === 'Sopapillas' ? '🫓' :
                           category === 'Sushi' ? '🍣' :
                           category === 'Acompañamientos' ? '🍟' :
                           '🍽️'}
                        </span>
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {items.map((complement: any) => (
                          <div
                            key={complement.id}
                            className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-atacama-orange transition-all bg-white"
                          >
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                              <Image
                                src={complement.image}
                                alt={complement.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {complement.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                ${complement.price.toLocaleString('es-CL')}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (onAddComplementToCart) {
                                  onAddComplementToCart({
                                    dishId: complement.id,
                                    name: complement.name,
                                    price: complement.price,
                                    image: complement.image,
                                    cookerName: complement.cookerName,
                                    cookerId: complement.cookerId,
                                    cookerAvatar: complement.cookerAvatar,
                                    quantity: 1,
                                    prepTime: complement.prepTime,
                                    category: complement.category
                                  });
                                  toast.success(`${complement.name} agregado al carrito`);
                                }
                              }}
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer fijo */}
        <div className="border-t border-gray-200 p-4 bg-white shrink-0">
          {/* Quantity selector */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-medium text-gray-900">Cantidad</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-10 w-10 rounded-full p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[2rem] text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 rounded-full p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add to cart button */}
          <Button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-atacama-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canAddToCart
              ? `Agregar al carrito • ${totalPrice.toLocaleString('es-CL')}`
              : 'Completa las opciones requeridas'
            }
          </Button>
        </div>
      </div>
    </div>
  );
}