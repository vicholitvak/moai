'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Plus, Minus, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';

interface EditDishModalProps {
  dish: { id: string; name: string; description: string; price: number; images: string[]; category: string; preparationTime: number; servingSize: number; dietaryRestrictions: string[]; nutrition: Record<string, number>; availability: boolean; };
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDish: { id: string; name: string; description: string; price: number; images: string[]; category: string; preparationTime: number; servingSize: number; dietaryRestrictions: string[]; nutrition: Record<string, number>; availability: boolean; }) => void;
}

const EditDishModal: React.FC<EditDishModalProps> = ({ dish, isOpen, onClose, onSave }) => {
  const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE5NVYxNDVIMjE1VjE2NUgxOTVWMTg1SDE3NVYxNjVIMTU1VjE0NUgxNzVWMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    prepTime: '',
    status: 'active',
    image: '',
    ingredients: [] as string[],
    allergens: [] as string[],
    nutritionInfo: {
      calories: 0,
      protein: '',
      carbs: '',
      fat: ''
    },
    deliveryMode: 'cook' as 'cook' | 'external',
    deliveryFee: 0
  });
  const [newIngredient, setNewIngredient] = useState('');
  const [newAllergen, setNewAllergen] = useState('');
  const [imagePreview, setImagePreview] = useState(defaultImage);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [showNutrition, setShowNutrition] = useState<boolean>(false);

  useEffect(() => {
    if (dish && isOpen) {
      setFormData({
        name: dish.name || '',
        description: dish.description || '',
        price: dish.price || 0,
        category: dish.category || '',
        prepTime: dish.prepTime || '',
        status: dish.status || 'active',
        image: dish.image || '',
        ingredients: dish.ingredients || [],
        deliveryMode: dish.deliveryMode || 'cook',
        deliveryFee: dish.deliveryFee || 0,
        allergens: dish.allergens || [],
        nutritionInfo: dish.nutritionInfo || {
          calories: 0,
          protein: '',
          carbs: '',
          fat: ''
        }
      });
      setImagePreview(dish.image || defaultImage);
      
      // Load additional images if they exist
      if (dish.images && Array.isArray(dish.images) && dish.images.length > 1) {
        setAdditionalImages(dish.images.slice(1));
      } else {
        setAdditionalImages([]);
      }
      
      // Check if nutrition info has values
      const hasNutrition = dish.nutritionInfo && 
        (dish.nutritionInfo.calories > 0 || 
         dish.nutritionInfo.protein !== '0g' || 
         dish.nutritionInfo.carbs !== '0g' || 
         dish.nutritionInfo.fat !== '0g');
      setShowNutrition(hasNutrition || false);
    }
  }, [dish, isOpen]);

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNutritionChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      nutritionInfo: {
        ...prev.nutritionInfo,
        [field]: value
      }
    }));
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addAllergen = () => {
    if (newAllergen.trim()) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, newAllergen.trim()]
      }));
      setNewAllergen('');
    }
  };

  const removeAllergen = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter((_, i) => i !== index)
    }));
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
      setFormData(prev => ({ ...prev, image: imageData }));
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

  const handleSave = () => {
    const allImages = [formData.image, ...additionalImages].filter(img => img && img !== defaultImage);
    const updatedDish = {
      ...dish,
      ...formData,
      images: allImages.length > 1 ? allImages : undefined,
      price: parseFloat(formData.price.toString()),
      nutritionInfo: showNutrition ? formData.nutritionInfo : {
        calories: 0,
        protein: '0g',
        carbs: '0g',
        fat: '0g'
      }
    };
    onSave(updatedDish);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Edit Dish</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Dish Name</Label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter dish name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="mt-1"
                      placeholder="Describe your dish..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prepTime">Prep Time</Label>
                      <input
                        id="prepTime"
                        type="text"
                        value={formData.prepTime}
                        onChange={(e) => handleInputChange('prepTime', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g., 30 mins"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Selecciona categoría</option>
                        <option value="Italiana">Italiana</option>
                        <option value="Mexicana">Mexicana</option>
                        <option value="Japonesa">Japonesa</option>
                        <option value="India">India</option>
                        <option value="Americana">Americana</option>
                        <option value="Francesa">Francesa</option>
                        <option value="China">China</option>
                        <option value="Tailandesa">Tailandesa</option>
                        <option value="Mediterránea">Mediterránea</option>
                        <option value="Vegana">Vegana</option>
                        <option value="Saludable">Saludable</option>
                        <option value="Acompañamientos">Acompañamientos</option>
                        <option value="Para Tomar">Para Tomar</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Image Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Imágenes del Plato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Main image preview with thumbnails */}
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={selectedImageIndex === 0 ? imagePreview : additionalImages[selectedImageIndex - 1]}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Thumbnails */}
                    {(imagePreview !== defaultImage || additionalImages.length > 0) && (
                      <div className="flex gap-2 overflow-x-auto">
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
                          id="main-image-upload-edit"
                        />
                        <Label htmlFor="main-image-upload-edit" className="cursor-pointer block">
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
                          id="additional-images-upload-edit"
                          disabled={additionalImages.length >= 5}
                        />
                        <Label 
                          htmlFor="additional-images-upload-edit" 
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
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Ingredients & Nutrition */}
            <div className="space-y-4">
              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIngredient}
                      onChange={(e) => setNewIngredient(e.target.value)}
                      className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Add ingredient"
                      onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                    />
                    <Button onClick={addIngredient} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{ingredient}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Allergens */}
              <Card>
                <CardHeader>
                  <CardTitle>Allergens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAllergen}
                      onChange={(e) => setNewAllergen(e.target.value)}
                      className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Add allergen"
                      onKeyPress={(e) => e.key === 'Enter' && addAllergen()}
                    />
                    <Button onClick={addAllergen} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.allergens.map((allergen, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {allergen}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeAllergen(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Nutrition Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Nutrition Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="calories">Calories</Label>
                      <input
                        id="calories"
                        type="number"
                        value={formData.nutritionInfo.calories}
                        onChange={(e) => handleNutritionChange('calories', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein">Protein</Label>
                      <input
                        id="protein"
                        type="text"
                        value={formData.nutritionInfo.protein}
                        onChange={(e) => handleNutritionChange('protein', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g., 25g"
                      />
                    </div>
                    <div>
                      <Label htmlFor="carbs">Carbs</Label>
                      <input
                        id="carbs"
                        type="text"
                        value={formData.nutritionInfo.carbs}
                        onChange={(e) => handleNutritionChange('carbs', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g., 45g"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fat">Fat</Label>
                      <input
                        id="fat"
                        type="text"
                        value={formData.nutritionInfo.fat}
                        onChange={(e) => handleNutritionChange('fat', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g., 15g"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDishModal;
