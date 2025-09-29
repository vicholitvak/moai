'use client';

import { useState } from 'react';
import { X, Upload, Plus, Minus, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE5NVYxNDVIMjE1VjE2NUgxOTVWMTg1SDE3NVYxNjVIMTU1VjE0NUgxNzVWMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
  const [imagePreview, setImagePreview] = useState<string>(defaultImage);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  
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
      image: imagePreview,
      images: [],
      deliveryMode: 'cook' as const,
      deliveryFee: 0
    },
    onSubmit: async (validatedData) => {
      const allImages = [validatedData.image, ...additionalImages].filter(img => img !== defaultImage);
      const dishData: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'> = {
        ...validatedData,
        image: validatedData.image,
        cookerId,
        cookerName,
        cookerAvatar,
        cookerRating,
        tags: [validatedData.category.toLowerCase(), 'nuevo'],
        rating: 0,
        reviewCount: 0,
        isAvailable: true
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

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
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
      setSelectedImageIndex(0);
    };
    reader.readAsDataURL(file);
  };
  
  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: string[] = [];
    let processedCount = 0;
    
    Array.from(files).forEach((file) => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('Image too large:', file.name);
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.name);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        newImages.push(imageData);
        processedCount++;
        
        // When all files are processed, update state
        if (processedCount === files.length) {
          setAdditionalImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 additional images
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    if (selectedImageIndex === index + 1) {
      setSelectedImageIndex(0);
    }
  };


  const handleClose = () => {
    reset();
    setImagePreview(defaultImage);
    setAdditionalImages([]);
    setSelectedImageIndex(0);
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
                  className={`mt-1 ${hasFieldError('name') ? 'border-red-500' : ''}`}
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
                    step="1"
                    value={data.price || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Handle empty string
                      if (value === '') {
                        handleInputChange('price', 0);
                        return;
                      }
                      // Parse as float to handle decimals, then round to nearest integer for CLP
                      const numValue = Math.round(parseFloat(value) || 0);
                      handleInputChange('price', numValue);
                    }}
                    className={`mt-1 ${hasFieldError('price') ? 'border-red-500' : ''}`}
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
                    className={`mt-1 ${hasFieldError('prepTime') ? 'border-red-500' : ''}`}
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
              
              {/* Delivery Mode */}
              <div>
                <Label>Modo de Entrega</Label>
                <Select
                  value={data.deliveryMode || 'cook'}
                  onValueChange={(value) => handleInputChange('deliveryMode', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecciona modo de entrega" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cook">
                      El cocinero se encarga del reparto
                    </SelectItem>
                    <SelectItem value="external">
                      Requiere servicio de delivery externo
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Define si realizas el reparto o necesitas un servicio externo.
                </p>
              </div>
              
              {/* Delivery Fee (shown only when cook delivers) */}
              {data.deliveryMode === 'cook' && (
                <div>
                  <Label htmlFor="deliveryFee">Tarifa de Entrega (CLP)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    min="0"
                    step="100"
                    value={data.deliveryFee || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleInputChange('deliveryFee', 0);
                        return;
                      }
                      const numValue = Math.round(parseFloat(value) || 0);
                      handleInputChange('deliveryFee', numValue);
                    }}
                    className="mt-1"
                    placeholder="2000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tarifa adicional por el servicio de entrega. Deja en 0 para entrega gratuita.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label>Imágenes del Plato *</Label>
                <div className="mt-2">
                  {/* Main image preview with thumbnails */}
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                    <img
                      src={selectedImageIndex === 0 ? imagePreview : additionalImages[selectedImageIndex - 1]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Thumbnails */}
                  {(imagePreview !== defaultImage || additionalImages.length > 0) && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {imagePreview !== defaultImage && (
                        <div 
                          className={`relative w-16 h-16 rounded border-2 cursor-pointer transition-all ${
                            selectedImageIndex === 0 ? 'border-primary' : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedImageIndex(0)}
                        >
                          <img src={imagePreview} alt="Main" className="w-full h-full object-cover rounded" />
                          <Badge className="absolute -top-2 -right-2 text-xs px-1">Principal</Badge>
                        </div>
                      )}
                      {additionalImages.map((img, index) => (
                        <div 
                          key={index}
                          className={`relative w-16 h-16 rounded border-2 cursor-pointer transition-all ${
                            selectedImageIndex === index + 1 ? 'border-primary' : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedImageIndex(index + 1)}
                        >
                          <img src={img} alt={`Additional ${index + 1}`} className="w-full h-full object-cover rounded" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAdditionalImage(index);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Upload buttons */}
                  <div className="space-y-2">
                    {/* Main image upload */}
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Imagen Principal</Label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        className="hidden"
                        id="main-image-upload"
                      />
                      <Label htmlFor="main-image-upload" className="cursor-pointer block">
                        <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg hover:border-primary hover:bg-primary/10 transition-all">
                          <Upload className="h-4 w-4 text-primary" />
                          <span className="text-sm">{imagePreview === defaultImage ? 'Seleccionar Imagen Principal' : 'Cambiar Imagen Principal'}</span>
                        </div>
                      </Label>
                    </div>
                    
                    {/* Additional images upload */}
                    <div>
                      <Label className="text-sm font-medium mb-1 block">Imágenes Adicionales</Label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAdditionalImagesUpload}
                        className="hidden"
                        id="additional-images-upload"
                        disabled={additionalImages.length >= 5}
                      />
                      <Label 
                        htmlFor="additional-images-upload" 
                        className={`cursor-pointer block ${
                          additionalImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg transition-all ${
                          additionalImages.length >= 5 
                            ? 'border-gray-300 bg-gray-50' 
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}>
                          <Plus className="h-4 w-4" />
                          <span className="text-sm">Agregar Más Fotos ({additionalImages.length}/5)</span>
                        </div>
                      </Label>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Puedes subir hasta 6 imágenes. La primera será la principal. Usa luz natural y muestra diferentes ángulos del plato.
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
