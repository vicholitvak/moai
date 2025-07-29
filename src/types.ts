export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  prepTime: number;
  imageUrl: string;
  cookerId: string;
  isActive: boolean;
  createdAt: any; // Should be Firestore Timestamp
}