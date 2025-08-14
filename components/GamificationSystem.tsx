'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Gift,
  Crown,
  Medal,
  Award,
  TrendingUp,
  Flame
} from 'lucide-react';

interface UserStats {
  totalPoints: number;
  totalOrders: number;
  currentStreak: number;
  achievements: Achievement[];
  weeklyPoints: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface GamificationSystemProps {
  user: any;
  className?: string;
  compact?: boolean;
}

const RARITY_COLORS = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500', 
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500'
};

export default function GamificationSystem({ user, className = '', compact = false }: GamificationSystemProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [recentPoints, setRecentPoints] = useState<{ points: number; reason: string } | null>(null);

  // Load real user stats from Firebase
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.uid) return;

      try {
        const { doc, getDoc, collection, getDocs, query, where } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/client');

        // Get user's gamification data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Get user's completed orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          where('status', '==', 'delivered')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const totalOrders = ordersSnapshot.size;

        // Calculate current streak (simplified - last consecutive days with orders)
        const today = new Date();
        let currentStreak = userData.currentStreak || 0;

        // Calculate weekly points (last 7 days)
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentOrders = ordersSnapshot.docs.filter(doc => {
          const orderData = doc.data();
          const orderDate = orderData.createdAt?.toDate();
          return orderDate && orderDate >= weekAgo;
        });
        const weeklyPoints = recentOrders.length * 10; // 10 points per order

        const userStatsData: UserStats = {
          totalPoints: userData.totalPoints || totalOrders * 10,
          totalOrders,
          currentStreak,
          weeklyPoints,
          achievements: []
        };

        // Calculate achievements based on real data
        const achievements: Achievement[] = [
          { 
            id: '1', 
            title: 'Primera Orden', 
            description: 'Tu primer pedido', 
            icon: Trophy, 
            rarity: 'common', 
            points: 10, 
            unlocked: totalOrders >= 1 
          },
          { 
            id: '2', 
            title: 'Explorador', 
            description: 'Prueba 3 cocinas diferentes', 
            icon: Star, 
            rarity: 'rare', 
            points: 25, 
            unlocked: (userData.categoriesTriedCount || 0) >= 3 
          },
          { 
            id: '3', 
            title: 'Fiel Cliente', 
            description: 'Realiza 10 pedidos', 
            icon: Crown, 
            rarity: 'epic', 
            points: 50, 
            unlocked: totalOrders >= 10 
          },
          { 
            id: '4', 
            title: 'Crítico Culinario', 
            description: 'Deja 5 reseñas', 
            icon: Award, 
            rarity: 'rare', 
            points: 30, 
            unlocked: (userData.reviewsCount || 0) >= 5 
          }
        ];

        userStatsData.achievements = achievements;
        setUserStats(userStatsData);

      } catch (error) {
        console.error('Error fetching user stats:', error);
        // Fallback to basic stats
        setUserStats({
          totalPoints: 0,
          totalOrders: 0,
          currentStreak: 0,
          weeklyPoints: 0,
          achievements: []
        });
      }
    };

    fetchUserStats();
  }, [user?.uid]);

  if (!user || !userStats) return null;

  const unlockedAchievements = userStats.achievements.filter(a => a.unlocked);

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">{userStats.totalPoints} PuntosÑam</span>
        </div>
        {userStats.currentStreak > 1 && (
          <div className="flex items-center space-x-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-gray-600">{userStats.currentStreak} días</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden border-0 shadow-lg ${className}`}>
      <CardContent className="p-6">
        {/* Recent Points Animation */}
        {recentPoints && (
          <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span className="font-medium">+{recentPoints.points} puntos</span>
            </div>
            <p className="text-xs opacity-90">{recentPoints.reason}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Star className="h-5 w-5 text-purple-600" />
                <span>PuntosÑam</span>
              </h3>
              <p className="text-sm text-gray-600">Gana puntos con cada pedido</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{userStats.totalPoints}</div>
              <div className="text-xs text-gray-500">puntos acumulados</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{userStats.totalOrders}</div>
              <div className="text-xs text-gray-500">Pedidos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500 flex items-center justify-center">
                <Flame className="h-4 w-4 mr-1" />
                {userStats.currentStreak}
              </div>
              <div className="text-xs text-gray-500">Días seguidos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">{userStats.weeklyPoints}</div>
              <div className="text-xs text-gray-500">Esta semana</div>
            </div>
          </div>

          {/* Achievements - Simpler */}
          {unlockedAchievements.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Logros</h4>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {unlockedAchievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`flex-shrink-0 w-12 h-12 rounded-lg ${RARITY_COLORS[achievement.rarity]} p-2 flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* Simple CTA */}
          <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
            <div className="text-center">
              <p className="text-sm text-purple-700">
                +10 PuntosÑam por cada pedido • +5 por cada reseña
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}