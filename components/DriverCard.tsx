'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VehicleIcon, { VEHICLE_CONFIG } from '@/components/VehicleIcon';
import { Star, MapPin, Clock } from 'lucide-react';
import type { Driver } from '@/lib/firebase/dataService';

interface DriverCardProps {
  driver: Driver;
  showVehicleDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function DriverCard({ 
  driver, 
  showVehicleDetails = true, 
  size = 'md' 
}: DriverCardProps) {
  const vehicleConfig = VEHICLE_CONFIG[driver.vehicleType];
  
  return (
    <Card className={`${size === 'sm' ? 'p-3' : 'p-4'} hover:shadow-lg transition-shadow`}>
      <CardHeader className={size === 'sm' ? 'pb-2' : 'pb-3'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className={size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'}>
              <AvatarImage src={driver.avatar} alt={driver.displayName} />
              <AvatarFallback>
                {driver.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <CardTitle className={size === 'sm' ? 'text-sm' : 'text-base'}>
                {driver.displayName}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <VehicleIcon 
                  vehicleType={driver.vehicleType} 
                  size={size === 'sm' ? 'sm' : 'md'} 
                />
                <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-600`}>
                  {vehicleConfig.name}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-1">
              <Star className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} fill-yellow-400 text-yellow-400`} />
              <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium`}>
                {driver.rating.toFixed(1)}
              </span>
            </div>
            
            <Badge 
              variant={driver.isOnline ? "default" : "secondary"}
              className={`${size === 'sm' ? 'text-xs px-2 py-0' : 'text-xs'} ${
                driver.isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {driver.isOnline ? '🟢 En línea' : '⚫ Fuera de línea'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {showVehicleDetails && (
        <CardContent className={size === 'sm' ? 'pt-0' : 'pt-2'}>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Entregas completadas:</span>
              <span className="font-medium">{driver.totalDeliveries}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Tasa de completado:</span>
              <span className="font-medium">{driver.completionRate}%</span>
            </div>
            
            {driver.vehicleInfo && (
              <div className="pt-2 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{vehicleConfig.emoji}</span>
                  <span>
                    {driver.vehicleInfo.make} {driver.vehicleInfo.model} 
                    {driver.vehicleInfo.year && ` (${driver.vehicleInfo.year})`}
                  </span>
                </div>
                {driver.vehicleInfo.licensePlate && (
                  <div className="text-xs text-gray-500 mt-1">
                    Patente: {driver.vehicleInfo.licensePlate}
                  </div>
                )}
              </div>
            )}
            
            {driver.currentLocation && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{driver.currentLocation.address.city}</span>
                <Clock className="h-3 w-3 ml-2" />
                <span>
                  Actualizado hace {Math.floor((Date.now() - driver.currentLocation.lastUpdated.toMillis()) / 60000)} min
                </span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}