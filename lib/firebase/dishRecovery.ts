import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './client';
import { Dish } from './dataService';

/**
 * Utility functions to help recover dishes that might be stuck due to Firestore indexing issues
 */
export class DishRecoveryService {
  private static collection = 'dishes';

  /**
   * Check for dishes that might be affected by indexing issues
   * This identifies dishes that might not appear in indexed queries
   */
  static async checkForStuckDishes(): Promise<{
    totalDishes: number;
    dishesWithoutCreatedAt: number;
    dishesWithInvalidData: number;
    stuckDishes: any[];
  }> {
    try {
      console.log('🔍 Checking for dishes that might be stuck due to indexing issues...');
      
      const querySnapshot = await getDocs(collection(db, this.collection));
      const allDishes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Dish & { id: string })[];

      const dishesWithoutCreatedAt = allDishes.filter(dish => !dish.createdAt);
      const dishesWithInvalidData = allDishes.filter(dish => 
        !dish.name || 
        !dish.cookerId || 
        dish.isAvailable === undefined ||
        !dish.category
      );

      const stuckDishes = allDishes.filter(dish => 
        !dish.createdAt || 
        !dish.updatedAt ||
        !dish.name ||
        !dish.cookerId ||
        dish.isAvailable === undefined
      );

      const report = {
        totalDishes: allDishes.length,
        dishesWithoutCreatedAt: dishesWithoutCreatedAt.length,
        dishesWithInvalidData: dishesWithInvalidData.length,
        stuckDishes: stuckDishes
      };

      console.log('📊 Dish Recovery Report:', report);
      
      return report;
    } catch (error) {
      console.error('Error checking for stuck dishes:', error);
      throw error;
    }
  }

  /**
   * Fix dishes that are missing required fields for indexing
   */
  static async fixStuckDishes(): Promise<{
    fixed: number;
    errors: number;
    details: string[];
  }> {
    try {
      console.log('🔧 Starting dish recovery process...');
      
      const report = await this.checkForStuckDishes();
      const results = {
        fixed: 0,
        errors: 0,
        details: [] as string[]
      };

      for (const dish of report.stuckDishes) {
        try {
          const updates: any = {};
          let needsUpdate = false;

          // Add missing createdAt timestamp
          if (!dish.createdAt) {
            updates.createdAt = Timestamp.now();
            needsUpdate = true;
            results.details.push(`Added createdAt to dish: ${dish.name || dish.id}`);
          }

          // Add missing updatedAt timestamp
          if (!dish.updatedAt) {
            updates.updatedAt = Timestamp.now();
            needsUpdate = true;
            results.details.push(`Added updatedAt to dish: ${dish.name || dish.id}`);
          }

          // Fix missing isAvailable field
          if (dish.isAvailable === undefined) {
            updates.isAvailable = true; // Default to available
            needsUpdate = true;
            results.details.push(`Set isAvailable to true for dish: ${dish.name || dish.id}`);
          }

          // Fix missing category
          if (!dish.category) {
            updates.category = 'Other'; // Default category
            needsUpdate = true;
            results.details.push(`Set default category for dish: ${dish.name || dish.id}`);
          }

          // Fix missing rating
          if (!dish.rating) {
            updates.rating = 0;
            needsUpdate = true;
            results.details.push(`Set default rating for dish: ${dish.name || dish.id}`);
          }

          if (needsUpdate) {
            const docRef = doc(db, this.collection, dish.id);
            await updateDoc(docRef, updates);
            results.fixed++;
            console.log(`✅ Fixed dish: ${dish.name || dish.id}`);
          }

        } catch (error) {
          results.errors++;
          results.details.push(`Error fixing dish ${dish.id}: ${error}`);
          console.error(`❌ Error fixing dish ${dish.id}:`, error);
        }
      }

      console.log(`🎉 Dish recovery completed! Fixed: ${results.fixed}, Errors: ${results.errors}`);
      return results;

    } catch (error) {
      console.error('Error during dish recovery:', error);
      throw error;
    }
  }

  /**
   * Force refresh all dish timestamps to ensure they work with new indexes
   */
  static async refreshAllDishTimestamps(): Promise<{
    updated: number;
    errors: number;
    details: string[];
  }> {
    try {
      console.log('🔄 Refreshing all dish timestamps...');
      
      const querySnapshot = await getDocs(collection(db, this.collection));
      const allDishes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Dish & { id: string })[];

      const results = {
        updated: 0,
        errors: 0,
        details: [] as string[]
      };

      for (const dish of allDishes) {
        try {
          const docRef = doc(db, this.collection, dish.id);
          await updateDoc(docRef, {
            updatedAt: Timestamp.now(),
            // Ensure createdAt exists
            ...(dish.createdAt ? {} : { createdAt: Timestamp.now() })
          });
          
          results.updated++;
          results.details.push(`Refreshed timestamps for: ${dish.name || dish.id}`);
          
        } catch (error) {
          results.errors++;
          results.details.push(`Error refreshing dish ${dish.id}: ${error}`);
          console.error(`❌ Error refreshing dish ${dish.id}:`, error);
        }
      }

      console.log(`🎉 Timestamp refresh completed! Updated: ${results.updated}, Errors: ${results.errors}`);
      return results;

    } catch (error) {
      console.error('Error during timestamp refresh:', error);
      throw error;
    }
  }

  /**
   * Get all dishes using the fallback method (no indexes required)
   */
  static async getAllDishesNoIndex(): Promise<any[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collection));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching dishes without index:', error);
      return [];
    }
  }
}
