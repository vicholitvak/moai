'use client';

import { Bike, Car, Zap } from 'lucide-react';

interface VehicleIconProps {
  vehicleType: 'bike' | 'motorcycle' | 'car';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'icon' | 'emoji' | 'both';
}

const VEHICLE_CONFIG = {
  bike: {
    icon: Bike,
    emoji: '🚴‍♂️',
    name: 'Bicicleta',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300'
  },
  motorcycle: {
    icon: Zap,
    emoji: '🏍️',
    name: 'Motocicleta',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300'
  },
  car: {
    icon: Car,
    emoji: '🚗',
    name: 'Automóvil',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300'
  }
};

const SIZE_CONFIG = {
  sm: {
    container: 'w-6 h-6',
    icon: 'h-3 w-3',
    text: 'text-xs'
  },
  md: {
    container: 'w-8 h-8',
    icon: 'h-4 w-4',
    text: 'text-sm'
  },
  lg: {
    container: 'w-12 h-12',
    icon: 'h-6 w-6',
    text: 'text-base'
  }
};

export default function VehicleIcon({ 
  vehicleType, 
  size = 'md', 
  className = '',
  variant = 'icon'
}: VehicleIconProps) {
  const config = VEHICLE_CONFIG[vehicleType];
  const sizeConfig = SIZE_CONFIG[size];
  const IconComponent = config.icon;

  if (variant === 'emoji') {
    return (
      <span className={`${sizeConfig.text} ${className}`}>
        {config.emoji}
      </span>
    );
  }

  if (variant === 'both') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`
          ${sizeConfig.container} 
          ${config.bgColor} 
          ${config.borderColor} 
          border rounded-full flex items-center justify-center
        `}>
          <IconComponent className={`${sizeConfig.icon} ${config.color}`} />
        </div>
        <span className={`${sizeConfig.text} font-medium`}>
          {config.emoji} {config.name}
        </span>
      </div>
    );
  }

  // Default variant: icon
  return (
    <div className={`
      ${sizeConfig.container} 
      ${config.bgColor} 
      ${config.borderColor} 
      border rounded-full flex items-center justify-center
      ${className}
    `}>
      <IconComponent className={`${sizeConfig.icon} ${config.color}`} />
    </div>
  );
}

// Export configuration for use in other components
export { VEHICLE_CONFIG };

// Map marker component for Google Maps or other mapping libraries
export function VehicleMapMarker({ 
  vehicleType, 
  isActive = false,
  className = ''
}: {
  vehicleType: 'bike' | 'motorcycle' | 'car';
  isActive?: boolean;
  className?: string;
}) {
  const config = VEHICLE_CONFIG[vehicleType];
  
  return (
    <div className={`
      relative w-10 h-10 
      ${isActive ? 'animate-pulse' : ''}
      ${className}
    `}>
      {/* Outer glow for active drivers */}
      {isActive && (
        <div className={`
          absolute inset-0 rounded-full 
          ${config.bgColor} 
          opacity-50 animate-ping
        `} />
      )}
      
      {/* Main marker */}
      <div className={`
        relative w-10 h-10 
        ${config.bgColor} 
        ${config.borderColor} 
        border-2 rounded-full flex items-center justify-center
        shadow-lg
      `}>
        <span className="text-lg">{config.emoji}</span>
      </div>
      
      {/* Status dot */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
}