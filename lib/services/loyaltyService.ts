import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment,
  arrayUnion,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { CouponService } from './couponService';
import { NotificationService } from './notificationService';

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints?: number;
  benefits: {
    discountPercentage: number;
    freeDeliveryThreshold: number;
    prioritySupport: boolean;
    exclusiveOffers: boolean;
    birthdayBonus: number;
    pointsMultiplier: number;
  };
  badge: {
    icon: string;
    color: string;
    gradient: string;
  };
  description: string;
}

export interface LoyaltyPoints {
  id: string;
  userId: string;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  currentTier: string;
  nextTier?: string;
  pointsToNextTier: number;
  joinDate: Timestamp;
  lastActivity: Timestamp;
  lifetimeSpent: number;
  totalOrders: number;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'referral';
  points: number;
  orderId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount_coupon' | 'free_delivery' | 'free_item' | 'cash_back' | 'experience';
  value: number;
  isActive: boolean;
  availableQuantity?: number;
  usedQuantity: number;
  validFor: number; // days
  requirements?: {
    minTier?: string;
    minOrders?: number;
    categories?: string[];
  };
  image?: string;
  featured: boolean;
}

export interface UserRedemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsUsed: number;
  couponCode?: string;
  status: 'active' | 'used' | 'expired';
  redeemedAt: Timestamp;
  expiresAt: Timestamp;
  usedAt?: Timestamp;
}

export class LoyaltyService {
  private static readonly COLLECTION_LOYALTY = 'loyaltyPoints';
  private static readonly COLLECTION_TRANSACTIONS = 'pointsTransactions';
  private static readonly COLLECTION_REWARDS = 'loyaltyRewards';
  private static readonly COLLECTION_REDEMPTIONS = 'userRedemptions';

  // Loyalty tiers configuration
  private static readonly TIERS: LoyaltyTier[] = [
    {
      id: 'explorer',
      name: 'Explorador',
      minPoints: 0,
      maxPoints: 999,
      benefits: {
        discountPercentage: 0,
        freeDeliveryThreshold: 25000,
        prioritySupport: false,
        exclusiveOffers: false,
        birthdayBonus: 100,
        pointsMultiplier: 1
      },
      badge: {
        icon: '🌱',
        color: '#10B981',
        gradient: 'from-green-400 to-green-600'
      },
      description: 'Comienza tu viaje culinario con Moai'
    },
    {
      id: 'foodie',
      name: 'Foodie',
      minPoints: 1000,
      maxPoints: 2999,
      benefits: {
        discountPercentage: 5,
        freeDeliveryThreshold: 20000,
        prioritySupport: false,
        exclusiveOffers: true,
        birthdayBonus: 250,
        pointsMultiplier: 1.2
      },
      badge: {
        icon: '🍽️',
        color: '#3B82F6',
        gradient: 'from-blue-400 to-blue-600'
      },
      description: 'Descubre nuevos sabores y recibe ofertas exclusivas'
    },
    {
      id: 'gourmet',
      name: 'Gourmet',
      minPoints: 3000,
      maxPoints: 6999,
      benefits: {
        discountPercentage: 10,
        freeDeliveryThreshold: 15000,
        prioritySupport: true,
        exclusiveOffers: true,
        birthdayBonus: 500,
        pointsMultiplier: 1.5
      },
      badge: {
        icon: '👨‍🍳',
        color: '#8B5CF6',
        gradient: 'from-purple-400 to-purple-600'
      },
      description: 'Disfruta de descuentos especiales y soporte prioritario'
    },
    {
      id: 'connoisseur',
      name: 'Conocedor',
      minPoints: 7000,
      maxPoints: 14999,
      benefits: {
        discountPercentage: 15,
        freeDeliveryThreshold: 10000,
        prioritySupport: true,
        exclusiveOffers: true,
        birthdayBonus: 1000,
        pointsMultiplier: 2
      },
      badge: {
        icon: '⭐',
        color: '#F59E0B',
        gradient: 'from-yellow-400 to-orange-500'
      },
      description: 'Acceso a experiencias culinarias únicas'
    },
    {
      id: 'legend',
      name: 'Leyenda',
      minPoints: 15000,
      benefits: {
        discountPercentage: 20,
        freeDeliveryThreshold: 0,
        prioritySupport: true,
        exclusiveOffers: true,
        birthdayBonus: 2000,
        pointsMultiplier: 2.5
      },
      badge: {
        icon: '👑',
        color: '#EF4444',
        gradient: 'from-red-400 to-pink-600'
      },
      description: 'El nivel máximo de excelencia gastronómica'
    }
  ];

  // Initialize loyalty program for new user
  static async initializeLoyalty(userId: string): Promise<void> {
    try {
      const loyaltyData: Omit<LoyaltyPoints, 'id'> = {
        userId,
        totalPoints: 0,
        availablePoints: 0,
        usedPoints: 0,
        currentTier: 'explorer',
        pointsToNextTier: 1000,
        joinDate: Timestamp.now(),
        lastActivity: Timestamp.now(),
        lifetimeSpent: 0,
        totalOrders: 0
      };

      await setDoc(doc(db, this.COLLECTION_LOYALTY, userId), loyaltyData);

      // Award welcome bonus
      await this.awardPoints(userId, 100, 'bonus', 'Bono de bienvenida a Moai', {
        category: 'welcome'
      });

      console.log('Loyalty program initialized for user:', userId);
    } catch (error) {
      console.error('Error initializing loyalty program:', error);
      throw error;
    }
  }

  // Award points for various actions
  static async awardPoints(
    userId: string,
    basePoints: number,
    type: PointsTransaction['type'],
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const loyaltyRef = doc(db, this.COLLECTION_LOYALTY, userId);
        const loyaltyDoc = await transaction.get(loyaltyRef);

        if (!loyaltyDoc.exists()) {
          await this.initializeLoyalty(userId);
          return;
        }

        const loyaltyData = loyaltyDoc.data() as LoyaltyPoints;
        const currentTier = this.getTierById(loyaltyData.currentTier);
        
        // Apply tier multiplier
        const finalPoints = Math.floor(basePoints * currentTier.benefits.pointsMultiplier);

        // Update loyalty points
        const newTotalPoints = loyaltyData.totalPoints + finalPoints;
        const newAvailablePoints = loyaltyData.availablePoints + finalPoints;
        const newTier = this.calculateTier(newTotalPoints);
        const pointsToNextTier = this.calculatePointsToNextTier(newTotalPoints);

        transaction.update(loyaltyRef, {
          totalPoints: newTotalPoints,
          availablePoints: newAvailablePoints,
          currentTier: newTier.id,
          nextTier: this.getNextTier(newTier.id)?.id,
          pointsToNextTier,
          lastActivity: Timestamp.now()
        });

        // Create transaction record
        const transactionData: Omit<PointsTransaction, 'id'> = {
          userId,
          type,
          points: finalPoints,
          description,
          metadata,
          createdAt: Timestamp.now(),
          expiresAt: type === 'earned' ? 
            Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) : // 1 year
            undefined
        };

        await addDoc(collection(db, this.COLLECTION_TRANSACTIONS), transactionData);

        // Check for tier upgrade
        if (newTier.id !== loyaltyData.currentTier) {
          await this.handleTierUpgrade(userId, loyaltyData.currentTier, newTier.id);
        }

        console.log(`Awarded ${finalPoints} points to user ${userId} (${description})`);
      });
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  // Award points for order completion
  static async awardOrderPoints(
    userId: string,
    orderId: string,
    orderTotal: number,
    isFirstOrder: boolean = false
  ): Promise<void> {
    try {
      // Base points: 1 point per $100 CLP spent
      const basePoints = Math.floor(orderTotal / 100);
      
      // First order bonus
      const firstOrderBonus = isFirstOrder ? 200 : 0;
      
      const totalPoints = basePoints + firstOrderBonus;

      await this.awardPoints(
        userId,
        totalPoints,
        'earned',
        `Puntos ganados por pedido #${orderId.slice(-6)}`,
        {
          orderId,
          orderTotal,
          basePoints,
          firstOrderBonus,
          isFirstOrder
        }
      );

      // Update lifetime stats
      await this.updateLifetimeStats(userId, orderTotal);

    } catch (error) {
      console.error('Error awarding order points:', error);
      throw error;
    }
  }

  // Redeem points for rewards
  static async redeemReward(userId: string, rewardId: string): Promise<UserRedemption> {
    try {
      return await runTransaction(db, async (transaction) => {
        const loyaltyRef = doc(db, this.COLLECTION_LOYALTY, userId);
        const rewardRef = doc(db, this.COLLECTION_REWARDS, rewardId);
        
        const [loyaltyDoc, rewardDoc] = await Promise.all([
          transaction.get(loyaltyRef),
          transaction.get(rewardRef)
        ]);

        if (!loyaltyDoc.exists() || !rewardDoc.exists()) {
          throw new Error('Usuario o recompensa no encontrados');
        }

        const loyaltyData = loyaltyDoc.data() as LoyaltyPoints;
        const reward = { id: rewardDoc.id, ...rewardDoc.data() } as LoyaltyReward;

        // Validate redemption
        if (loyaltyData.availablePoints < reward.pointsCost) {
          throw new Error('Puntos insuficientes');
        }

        if (!reward.isActive) {
          throw new Error('Recompensa no disponible');
        }

        if (reward.availableQuantity && reward.availableQuantity <= reward.usedQuantity) {
          throw new Error('Recompensa agotada');
        }

        // Check tier requirements
        if (reward.requirements?.minTier) {
          const userTier = this.getTierById(loyaltyData.currentTier);
          const requiredTier = this.getTierById(reward.requirements.minTier);
          if (userTier.minPoints < requiredTier.minPoints) {
            throw new Error('Tier insuficiente para esta recompensa');
          }
        }

        // Update loyalty points
        transaction.update(loyaltyRef, {
          availablePoints: loyaltyData.availablePoints - reward.pointsCost,
          usedPoints: loyaltyData.usedPoints + reward.pointsCost,
          lastActivity: Timestamp.now()
        });

        // Update reward usage
        transaction.update(rewardRef, {
          usedQuantity: increment(1)
        });

        // Create redemption record
        const redemptionData: Omit<UserRedemption, 'id'> = {
          userId,
          rewardId,
          pointsUsed: reward.pointsCost,
          status: 'active',
          redeemedAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(new Date(Date.now() + reward.validFor * 24 * 60 * 60 * 1000))
        };

        // Generate coupon if needed
        if (reward.type === 'discount_coupon') {
          const couponCode = await this.generateRewardCoupon(userId, reward);
          redemptionData.couponCode = couponCode;
        }

        const redemptionRef = await addDoc(collection(db, this.COLLECTION_REDEMPTIONS), redemptionData);
        
        // Create points transaction
        await this.awardPoints(
          userId,
          -reward.pointsCost,
          'redeemed',
          `Canjeado: ${reward.name}`,
          { rewardId, redemptionId: redemptionRef.id }
        );

        // Send notification
        NotificationService.create({
          title: '¡Recompensa canjeada! 🎁',
          message: `Has canjeado ${reward.name} por ${reward.pointsCost} puntos`,
          type: 'success',
          priority: 'medium',
          category: 'system',
          metadata: { rewardId, redemptionId: redemptionRef.id }
        });

        return { id: redemptionRef.id, ...redemptionData } as UserRedemption;
      });
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  // Get user's loyalty status
  static async getUserLoyalty(userId: string): Promise<LoyaltyPoints | null> {
    try {
      const doc = await getDoc(doc(db, this.COLLECTION_LOYALTY, userId));
      if (!doc.exists()) return null;
      
      return { id: doc.id, ...doc.data() } as LoyaltyPoints;
    } catch (error) {
      console.error('Error getting user loyalty:', error);
      return null;
    }
  }

  // Get available rewards
  static async getAvailableRewards(): Promise<LoyaltyReward[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_REWARDS),
        where('isActive', '==', true),
        orderBy('pointsCost', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoyaltyReward));
    } catch (error) {
      console.error('Error getting rewards:', error);
      return [];
    }
  }

  // Get user's points history
  static async getPointsHistory(userId: string, limitCount: number = 50): Promise<PointsTransaction[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_TRANSACTIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PointsTransaction));
    } catch (error) {
      console.error('Error getting points history:', error);
      return [];
    }
  }

  // Get user's redemptions
  static async getUserRedemptions(userId: string): Promise<UserRedemption[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_REDEMPTIONS),
        where('userId', '==', userId),
        orderBy('redeemedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRedemption));
    } catch (error) {
      console.error('Error getting user redemptions:', error);
      return [];
    }
  }

  // Referral bonus
  static async awardReferralBonus(referrerId: string, refereeId: string): Promise<void> {
    try {
      // Award points to referrer
      await this.awardPoints(
        referrerId,
        500,
        'referral',
        'Bonus por invitar a un amigo',
        { refereeId, type: 'referrer' }
      );

      // Award points to referee
      await this.awardPoints(
        refereeId,
        200,
        'referral',
        'Bonus por unirte mediante invitación',
        { referrerId, type: 'referee' }
      );

      console.log(`Referral bonus awarded: ${referrerId} -> ${refereeId}`);
    } catch (error) {
      console.error('Error awarding referral bonus:', error);
      throw error;
    }
  }

  // Birthday bonus
  static async awardBirthdayBonus(userId: string): Promise<void> {
    try {
      const loyalty = await this.getUserLoyalty(userId);
      if (!loyalty) return;

      const tier = this.getTierById(loyalty.currentTier);
      const birthdayPoints = tier.benefits.birthdayBonus;

      await this.awardPoints(
        userId,
        birthdayPoints,
        'bonus',
        '¡Feliz cumpleaños! 🎂',
        { category: 'birthday', tier: tier.id }
      );

      // Generate special birthday coupon
      await CouponService.generateBirthdayCoupon(userId, tier.benefits.discountPercentage + 10);

    } catch (error) {
      console.error('Error awarding birthday bonus:', error);
      throw error;
    }
  }

  // Helper methods
  private static getTierById(tierId: string): LoyaltyTier {
    return this.TIERS.find(tier => tier.id === tierId) || this.TIERS[0];
  }

  private static calculateTier(totalPoints: number): LoyaltyTier {
    for (let i = this.TIERS.length - 1; i >= 0; i--) {
      const tier = this.TIERS[i];
      if (totalPoints >= tier.minPoints) {
        return tier;
      }
    }
    return this.TIERS[0];
  }

  private static getNextTier(currentTierId: string): LoyaltyTier | null {
    const currentIndex = this.TIERS.findIndex(tier => tier.id === currentTierId);
    return currentIndex < this.TIERS.length - 1 ? this.TIERS[currentIndex + 1] : null;
  }

  private static calculatePointsToNextTier(totalPoints: number): number {
    const nextTier = this.getNextTier(this.calculateTier(totalPoints).id);
    return nextTier ? nextTier.minPoints - totalPoints : 0;
  }

  private static async handleTierUpgrade(userId: string, oldTierId: string, newTierId: string): Promise<void> {
    try {
      const newTier = this.getTierById(newTierId);
      
      // Send notification
      NotificationService.create({
        title: `¡Nivel alcanzado: ${newTier.name}! ${newTier.badge.icon}`,
        message: `Has alcanzado el nivel ${newTier.name}. ¡Disfruta de nuevos beneficios!`,
        type: 'success',
        priority: 'high',
        category: 'system',
        metadata: { oldTier: oldTierId, newTier: newTierId }
      });

      // Award tier upgrade bonus
      const upgradeBonus = newTier.minPoints * 0.1; // 10% of tier minimum as bonus
      await this.awardPoints(
        userId,
        Math.floor(upgradeBonus),
        'bonus',
        `Bonus por alcanzar nivel ${newTier.name}`,
        { tierUpgrade: true, fromTier: oldTierId, toTier: newTierId }
      );

      console.log(`User ${userId} upgraded from ${oldTierId} to ${newTierId}`);
    } catch (error) {
      console.error('Error handling tier upgrade:', error);
    }
  }

  private static async updateLifetimeStats(userId: string, orderTotal: number): Promise<void> {
    try {
      const loyaltyRef = doc(db, this.COLLECTION_LOYALTY, userId);
      await updateDoc(loyaltyRef, {
        lifetimeSpent: increment(orderTotal),
        totalOrders: increment(1)
      });
    } catch (error) {
      console.error('Error updating lifetime stats:', error);
    }
  }

  private static async generateRewardCoupon(userId: string, reward: LoyaltyReward): Promise<string> {
    try {
      const couponCode = `REWARD${Date.now().toString().slice(-6)}`;
      
      // This would integrate with CouponService to create the actual coupon
      // For now, return the generated code
      return couponCode;
    } catch (error) {
      console.error('Error generating reward coupon:', error);
      throw error;
    }
  }

  // Public getters for tier information
  static getAllTiers(): LoyaltyTier[] {
    return [...this.TIERS];
  }

  static getTierByPoints(points: number): LoyaltyTier {
    return this.calculateTier(points);
  }
}