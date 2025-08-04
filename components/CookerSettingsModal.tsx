'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Save, User, Bell, Shield, CreditCard, MapPin, Clock, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface CookerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  currentUser: any;
}

const CookerSettingsModal: React.FC<CookerSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'account'>('profile');
  const [formData, setFormData] = useState({
    // Profile settings
    displayName: '',
    bio: '',
    avatar: '',
    coverImage: '',
    phone: '',
    location: '',
    deliveryRadius: 5,
    specialties: [] as string[],
    languages: [] as string[],
    
    // Preferences
    autoAcceptOrders: false,
    maxOrdersPerDay: 20,
    selfDelivery: false,
    workingHours: {
      start: '09:00',
      end: '21:00'
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    
    // Notifications
    emailNotifications: {
      newOrders: true,
      orderUpdates: true,
      reviews: true,
      promotions: false
    },
    pushNotifications: {
      newOrders: true,
      orderUpdates: true,
      reviews: true,
      promotions: false
    },
    
    // Account
    currency: 'CLP',
    timezone: 'America/Santiago',
    language: 'Español'
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');

  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData(prev => ({
        ...prev,
        displayName: currentUser.displayName || '',
        bio: currentUser.bio || '',
        avatar: currentUser.photoURL || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        // Set other defaults based on user data
      }));
      setAvatarPreview(currentUser.photoURL || '');
    }
  }, [currentUser, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev] as any,
        [field]: value
      }
    }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCoverPreview(result);
        setFormData(prev => ({ ...prev, coverImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              <Button
                variant={activeTab === 'profile' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant={activeTab === 'preferences' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('preferences')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Preferences
              </Button>
              <Button
                variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button
                variant={activeTab === 'account' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('account')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Account
              </Button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                  
                  {/* Avatar Upload */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Profile Picture</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={avatarPreview} />
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Label htmlFor="avatar-upload" className="cursor-pointer">
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Change Photo
                              </span>
                            </Button>
                          </Label>
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <input
                        id="displayName"
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="mt-1"
                      placeholder="Tell customers about yourself and your cooking..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <input
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                      <input
                        id="deliveryRadius"
                        type="number"
                        min="1"
                        max="50"
                        value={formData.deliveryRadius}
                        onChange={(e) => handleInputChange('deliveryRadius', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Specialties */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Cooking Specialties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newSpecialty}
                          onChange={(e) => setNewSpecialty(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add a specialty"
                          onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                        />
                        <Button onClick={addSpecialty} size="sm">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                            {specialty}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeSpecialty(specialty)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Languages */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Languages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newLanguage}
                          onChange={(e) => setNewLanguage(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add a language"
                          onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                        />
                        <Button onClick={addLanguage} size="sm">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.languages.map((language) => (
                          <Badge key={language} variant="secondary" className="flex items-center gap-1">
                            {language}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeLanguage(language)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Cooking Preferences</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Order Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-accept orders</Label>
                        <p className="text-sm text-gray-600">Automatically accept orders without manual approval</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.autoAcceptOrders}
                        onChange={(e) => handleInputChange('autoAcceptOrders', e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxOrders">Maximum orders per day</Label>
                      <input
                        id="maxOrders"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.maxOrdersPerDay}
                        onChange={(e) => handleInputChange('maxOrdersPerDay', parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Self-delivery</Label>
                        <p className="text-sm text-gray-600">Deliver orders yourself instead of using drivers</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.selfDelivery || false}
                        onChange={(e) => handleInputChange('selfDelivery', e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Working Hours</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <input
                          id="startTime"
                          type="time"
                          value={formData.workingHours.start}
                          onChange={(e) => handleNestedChange('workingHours', 'start', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <input
                          id="endTime"
                          type="time"
                          value={formData.workingHours.end}
                          onChange={(e) => handleNestedChange('workingHours', 'end', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Working Days</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                          <label key={day} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.workingDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleInputChange('workingDays', [...formData.workingDays, day]);
                                } else {
                                  handleInputChange('workingDays', formData.workingDays.filter(d => d !== day));
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <span className="text-sm capitalize">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(formData.emailNotifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleNestedChange('emailNotifications', key, e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Push Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(formData.pushNotifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleNestedChange('pushNotifications', key, e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <select
                          id="currency"
                          value={formData.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="CLP">CLP ($)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD ($)</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <select
                          id="language"
                          value={formData.language}
                          onChange={(e) => handleInputChange('language', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Español">Español</option>
                          <option value="English">English</option>
                          <option value="French">French</option>
                          <option value="Italian">Italian</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="America/Santiago">Santiago, Chile</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payment Settings
                    </Button>
                    <Button variant="destructive" className="w-full">
                      Deactivate Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookerSettingsModal;
