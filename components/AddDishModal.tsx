'use client';

import { useState } from 'react';
import { X, Upload, Plus, Minus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Dish } from '@/lib/firebase/dataService';
import { useFormValidation } from '@/hooks/useFormValidation';
import { addDishSchema, type AddDishFormData } from '@/lib/schemas/dishSchema';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dishData: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>) => void;
  cookerId: string;
  cookerName: string;
  cookerAvatar: string;
  cookerRating: number;
}

export function AddDishModal({ 
  isOpen, 
  onClose, 
  onSave, 
  cookerId, 
  cookerName, 
  cookerAvatar, 
  cookerRating 
}: AddDishModalProps) {
  const [imagePreview, setImagePreview] = useState<string>('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ci8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE5NVYxNDVIMjE1VjE2NUgxOTVWMTg1SDE3NVYxNjVIMTU1VjE0NUgxNzVWMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K');
  
  const {
    data,
    errors,
    isSubmitting,
    setValue,
    getFieldError,
    hasFieldError,
    handleSubmit,
    reset
  } = useFormValidation<AddDishFormData>({
    schema: addDishSchema,
    initialData: {
      name: '',
      description: '',
      price: 0,
      category: 'Platos principales' as const,
      prepTime: '',
      ingredients: [''],
      image: imagePreview
    },
    onSubmit: async (validatedData) => {
      const dishData: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'> = {
        ...validatedData,
        cookerId,
        cookerName,
        cookerAvatar,
        cookerRating,
        tags: [validatedData.category.toLowerCase(), 'nuevo'],
        rating: 0,
        reviewCount: 0,
        isAvailable: true,
        allergens: [],
        nutritionInfo: {
          calories: 0,
          protein: '0g',
          carbs: '0g',
          fat: '0g'
        }
      };
      
      await onSave(dishData);
      handleClose();
    }
  });

  const categories = [
    'Platos principales',
    'Acompañamientos', 
    'Bebidas'
  ];

  const handleInputChange = (field: keyof AddDishFormData, value: any) => {
    setValue(field, value);
  };

  const handleArrayChange = (field: 'ingredients', index: number, value: string) => {
    const currentIngredients = data.ingredients || [''];
    const newIngredients = currentIngredients.map((item, i) => i === index ? value : item);
    setValue(field, newIngredients);
  };

  const addArrayItem = (field: 'ingredients') => {
    const currentIngredients = data.ingredients || [''];
    setValue(field, [...currentIngredients, '']);
  };

  const removeArrayItem = (field: 'ingredients', index: number) => {
    const currentIngredients = data.ingredients || [''];
    if (currentIngredients.length > 1) {
      setValue(field, currentIngredients.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        // You could use toast here or set a specific error
        console.error('Image too large');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setImagePreview(imageData);
        setValue('image', imageData);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleClose = () => {
    reset();
    setImagePreview('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ci8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE5NVYxNDFIMjE1VjE2NUgxOTVWMTg1SDE3NVYxNjVIMTU1VjE0NUgxNzVWMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K');
    onClose();
  };

  // Helper component for displaying field errors
  const FieldError = ({ field }: { field: keyof AddDishFormData }) => {
    const error = getFieldError(field);
    if (!error) return null;
    
    return (
      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Agregar Nuevo Plato</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Nombre del Plato *</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={data.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={hasFieldError('name') ? 'border-red-500' : ''}
                  placeholder="Ej: Spaghetti Carbonara"
                />
                <FieldError field="name" />
              </div>

              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  required
                  value={data.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full mt-1 ${
                    hasFieldError('description') ? 'border-red-500' : ''
                  }`}
                  placeholder="Describe tu plato de manera atractiva. Incluye sabores, ingredientes especiales, técnica de preparación y qué lo hace único..."
                  rows={5}
                />
                <FieldError field="description" />
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: Una buena descripción aumenta las ventas. Destaca lo que hace especial a tu plato.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Precio (CLP) *</Label>
                  <Input
                    id="price"
                    type="number"
                    required
                    min="0"
                    value={data.price || ''}
                    onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                    className={hasFieldError('price') ? 'border-red-500' : ''}
                    placeholder="10990"
                  />
                  <FieldError field="price" />
                </div>

                <div>
                  <Label htmlFor="prepTime">Tiempo de Preparación *</Label>
                  <Input
                    id="prepTime"
                    type="text"
                    required
                    value={data.prepTime || ''}
                    onChange={(e) => handleInputChange('prepTime', e.target.value)}
                    className={hasFieldError('prepTime') ? 'border-red-500' : ''}
                    placeholder="25 mins"
                  />
                  <FieldError field="prepTime" />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={data.category || 'Platos principales'}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className={hasFieldError('category') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError field="category" />
              </div>

              {/* Ingredients */}
              <div>
                <Label>Ingredientes *</Label>
                <div className="space-y-2 mt-2">
                  {(data.ingredients || ['']).map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="text"
                        value={ingredient}
                        onChange={(e) => handleArrayChange('ingredients', index, e.target.value)}
                        className={`flex-1 ${hasFieldError('ingredients') ? 'border-red-500' : ''}`}
                        placeholder="Ej: Pasta fresca, tomates, queso parmesano"
                        required={index === 0}
                      />
                      {(data.ingredients || ['']).length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('ingredients', index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('ingredients')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Ingrediente
                  </Button>
                </div>
                <FieldError field="ingredients" />
                <p className="text-xs text-muted-foreground mt-1">
                  Lista los ingredientes principales que hacen especial a tu plato.
                </p>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label>Imagen del Plato *</Label>
                <div className="mt-2">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>Subir Imagen</span>
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Una buena foto aumenta significativamente las ventas. Usa luz natural y muestra el plato completo.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Agregar Plato'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
