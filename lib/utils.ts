import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  // Format price in Chilean Peso (CLP) without decimals
  return `$${Math.round(price).toLocaleString('es-CL')}`
}

export function generateDeliveryCode(): string {
  // Generate a 4-digit delivery code (similar to PedidosYa)
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function formatDeliveryCode(code: string): string {
  // Format delivery code for display (e.g., "1234" -> "12-34")
  return code.replace(/(\d{2})(\d{2})/, '$1-$2')
}

export function parsePreparationTime(prepTime: string): number {
  // Parse preparation time string to minutes (e.g., "30 min" -> 30, "1 hour" -> 60)
  const timeStr = prepTime.toLowerCase();
  
  if (timeStr.includes('hour')) {
    const hours = parseFloat(timeStr.match(/(\d+(?:\.\d+)?)/)?.[1] ?? '1');
    return hours * 60;
  } else if (timeStr.includes('min')) {
    return parseInt(timeStr.match(/(\d+)/)?.[1] ?? '30');
  }
  
  // Default fallback
  return 30;
}

export function calculateOrderPreparationTime(dishes: Array<{ prepTime: string; quantity: number }>): number {
  // Calculate total preparation time for an order (take the longest dish prep time)
  let maxPrepTime = 0;
  
  dishes.forEach(dish => {
    const dishPrepTime = parsePreparationTime(dish.prepTime);
    if (dishPrepTime > maxPrepTime) {
      maxPrepTime = dishPrepTime;
    }
  });
  
  return maxPrepTime;
}

export function calculateProgressPercentage(startTime: Date, prepTimeMinutes: number): number {
  const now = new Date();
  const elapsedMs = now.getTime() - startTime.getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);
  const progress = (elapsedMinutes / prepTimeMinutes) * 100;
  
  return Math.min(Math.max(progress, 0), 100);
}

export function getEstimatedReadyTime(startTime: Date, prepTimeMinutes: number): Date {
  const readyTime = new Date(startTime);
  readyTime.setMinutes(readyTime.getMinutes() + prepTimeMinutes);
  return readyTime;
}

export function formatTimeRemaining(startTime: Date, prepTimeMinutes: number): string {
  const now = new Date();
  const readyTime = getEstimatedReadyTime(startTime, prepTimeMinutes);
  const remainingMs = readyTime.getTime() - now.getTime();
  
  if (remainingMs <= 0) {
    return 'Listo';
  }
  
  const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
  
  if (remainingMinutes < 60) {
    return `${remainingMinutes} min`;
  } else {
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    return `${hours}h ${mins}m`;
  }
}
