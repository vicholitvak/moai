'use client';

import { useState } from 'react';
import { X, Upload, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type Dish } from '@/lib/firebase/dataService';

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Italiana',
    prepTime: '',
    ingredients: [''],
    allergens: [''],
    nutritionInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    }
  });
  const [imagePreview, setImagePreview] = useState<string>('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE5NVYxNDVIMjE1VjE2NUgxOTVWMTg1SDE3NVYxNjVIMTU1VjE0NUgxNzVWMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Italiana', 'Mexicana', 'Japonesa', 'India', 'Americana', 
    'Francesa', 'China', 'Tailandesa', 'Mediterránea', 'Vegana', 'Saludable'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNutritionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      nutritionInfo: {
        ...prev.nutritionInfo,
        [field]: value
      }
    }));
  };

  const handleArrayChange = (field: 'ingredients' | 'allergens', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'ingredients' | 'allergens') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'ingredients' | 'allergens', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dishData: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        image: imagePreview,
        cookerId,
        cookerName,
        cookerAvatar,
        cookerRating,
        category: formData.category,
        tags: [formData.category.toLowerCase(), 'nuevo'],
        rating: 0,
        reviewCount: 0,
        prepTime: formData.prepTime,
        isAvailable: true,
        ingredients: formData.ingredients.filter(ingredient => ingredient.trim() !== ''),
        allergens: formData.allergens.filter(allergen => allergen.trim() !== ''),
        nutritionInfo: {
          calories: parseInt(formData.nutritionInfo.calories) || 0,
          protein: formData.nutritionInfo.protein || '0g',
          carbs: formData.nutritionInfo.carbs || '0g',
          fat: formData.nutritionInfo.fat || '0g'
        }
      };

      await onSave(dishData);
      handleClose();
    } catch (error) {
      console.error('Error adding dish:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Italiana',
      prepTime: '',
      ingredients: [''],
      allergens: [''],
      nutritionInfo: {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      }
    });
    setImagePreview('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ci8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE5NVYxNDVIMjE1VjE2NUgxOTVWMTg1SDE3NVYxNjVIMTU1VjE0NUgxNzVWMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K');
    onClose();
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Plato *</Label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Spaghetti Carbonara"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full mt-1"
                  placeholder="Describe tu plato, ingredientes principales y técnicas de preparación..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Precio (CLP) *</Label>
                  <input
                    id="price"
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10990"
                  />
                </div>

                <div>
                  <Label htmlFor="prepTime">Tiempo de Preparación *</Label>
                  <input
                    id="prepTime"
                    type="text"
                    required
                    value={formData.prepTime}
                    onChange={(e) => handleInputChange('prepTime', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25 mins"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Categoría *</Label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Imagen del Plato</Label>
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
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-4">
              {/* Ingredients */}
              <div>
                <Label>Ingredientes *</Label>
                <div className="space-y-2 mt-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => handleArrayChange('ingredients', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Pasta Spaghetti"
                        required={index === 0}
                      />
                      {formData.ingredients.length > 1 && (
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
              </div>

              {/* Allergens */}
              <div>
                <Label>Alérgenos</Label>
                <div className="space-y-2 mt-2">
                  {formData.allergens.map((allergen, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={allergen}
                        onChange={(e) => handleArrayChange('allergens', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Gluten, Lácteos"
                      />
                      {formData.allergens.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('allergens', index)}
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
                    onClick={() => addArrayItem('allergens')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Alérgeno
                  </Button>
                </div>
              </div>

              {/* Nutrition Info */}
              <div>
                <Label>Información Nutricional</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <input
                      type="number"
                      value={formData.nutritionInfo.calories}
                      onChange={(e) => handleNutritionChange('calories', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Calorías"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.nutritionInfo.protein}
                      onChange={(e) => handleNutritionChange('protein', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Proteína (ej: 22g)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.nutritionInfo.carbs}
                      onChange={(e) => handleNutritionChange('carbs', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Carbohidratos (ej: 65g)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.nutritionInfo.fat}
                      onChange={(e) => handleNutritionChange('fat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Grasa (ej: 26g)"
                    />
                  </div>
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
