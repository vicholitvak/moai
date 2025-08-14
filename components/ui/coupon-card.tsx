'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Gift, 
  Percent, 
  DollarSign, 
  Truck, 
  Clock, 
  Copy, 
  Check,
  Sparkles,
  Tag,
  Calendar,
  Users
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'free_delivery' | 'buy_one_get_one';
  value: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  validUntil: Date;
  isActive: boolean;
  firstTimeUserOnly: boolean;
  usageCount?: number;
  usageLimit?: number;
}

interface CouponCardProps {
  coupon: Coupon;
  isApplied?: boolean;
  canApply?: boolean;
  onApply?: (code: string) => void;
  onRemove?: () => void;
  compact?: boolean;
  showUsageStats?: boolean;
}

const CouponCard: React.FC<CouponCardProps> = ({
  coupon,
  isApplied = false,
  canApply = true,
  onApply,
  onRemove,
  compact = false,
  showUsageStats = false
}) => {
  const [copied, setCopied] = useState(false);

  const getCouponIcon = () => {
    switch (coupon.type) {
      case 'percentage':
        return <Percent className="h-5 w-5" />;
      case 'fixed_amount':
        return <DollarSign className="h-5 w-5" />;
      case 'free_delivery':
        return <Truck className="h-5 w-5" />;
      case 'buy_one_get_one':
        return <Gift className="h-5 w-5" />;
      default:
        return <Tag className="h-5 w-5" />;
    }
  };

  const getCouponValueDisplay = () => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}% OFF`;
      case 'fixed_amount':
        return `${formatPrice(coupon.value)} OFF`;
      case 'free_delivery':
        return 'ENVÍO GRATIS';
      case 'buy_one_get_one':
        return 'COMPRA 1 LLEVA 2';
      default:
        return 'DESCUENTO';
    }
  };

  const getCouponColor = () => {
    if (!coupon.isActive) return 'bg-gray-100 border-gray-200';
    
    switch (coupon.type) {
      case 'percentage':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200';
      case 'fixed_amount':
        return 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200';
      case 'free_delivery':
        return 'bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200';
      case 'buy_one_get_one':
        return 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200';
      default:
        return 'bg-gradient-to-br from-pink-50 to-rose-100 border-pink-200';
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar el código');
    }
  };

  const handleApply = () => {
    if (onApply && canApply && coupon.isActive) {
      onApply(coupon.code);
    }
  };

  const isExpired = new Date() > coupon.validUntil;
  const isExpiringSoon = !isExpired && 
    (coupon.validUntil.getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000; // 3 days

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`p-3 rounded-lg border-2 border-dashed ${
          isApplied ? 'border-green-500 bg-green-50' : 'border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isApplied ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
            }`}>
              {getCouponIcon()}
            </div>
            <div>
              <p className="font-semibold text-sm">{coupon.code}</p>
              <p className="text-xs text-muted-foreground">{getCouponValueDisplay()}</p>
            </div>
          </div>
          
          {isApplied ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700"
            >
              Quitar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApply}
              disabled={!canApply || !coupon.isActive || isExpired}
            >
              Aplicar
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden ${getCouponColor()} ${
        isApplied ? 'ring-2 ring-green-500' : ''
      } ${!coupon.isActive || isExpired ? 'opacity-60' : ''}`}>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Sparkles className="w-full h-full" />
        </div>
        
        {/* Expiry warning badge */}
        {isExpiringSoon && !isExpired && (
          <Badge 
            variant="destructive" 
            className="absolute top-2 right-2 animate-pulse"
          >
            <Clock className="h-3 w-3 mr-1" />
            Expira pronto
          </Badge>
        )}

        {/* First time user badge */}
        {coupon.firstTimeUserOnly && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2"
          >
            <Users className="h-3 w-3 mr-1" />
            Solo nuevos usuarios
          </Badge>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-white/50 backdrop-blur-sm">
                {getCouponIcon()}
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  {coupon.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {coupon.description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Coupon value display */}
          <div className="text-center py-4 bg-white/50 rounded-lg backdrop-blur-sm">
            <div className="text-2xl font-bold text-primary mb-1">
              {getCouponValueDisplay()}
            </div>
            {coupon.type === 'percentage' && coupon.maximumDiscount && (
              <p className="text-xs text-muted-foreground">
                Máximo {formatPrice(coupon.maximumDiscount)}
              </p>
            )}
          </div>

          {/* Coupon code */}
          <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg border-2 border-dashed border-primary/30">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Código del cupón</p>
              <p className="font-mono font-bold text-lg tracking-wider">
                {coupon.code}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyCode}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Terms and conditions */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Compra mínima: {formatPrice(coupon.minimumOrderAmount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Válido hasta: {coupon.validUntil.toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Usage statistics */}
          {showUsageStats && coupon.usageCount !== undefined && coupon.usageLimit && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usos restantes</span>
                <span>{coupon.usageLimit - coupon.usageCount} de {coupon.usageLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((coupon.usageLimit - coupon.usageCount) / coupon.usageLimit) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {isApplied ? (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={onRemove}
              >
                <Check className="h-4 w-4 mr-2" />
                Aplicado - Quitar
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={handleApply}
                disabled={!canApply || !coupon.isActive || isExpired}
              >
                {isExpired ? 'Expirado' : 'Aplicar cupón'}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={copyCode}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Error states */}
          {isExpired && (
            <div className="text-center py-2 px-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">
                Este cupón ha expirado
              </p>
            </div>
          )}

          {!canApply && !isExpired && coupon.isActive && (
            <div className="text-center py-2 px-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700 font-medium">
                No cumples los requisitos para este cupón
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CouponCard;