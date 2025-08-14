import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { OrdersService } from '@/lib/firebase/dataService';
import { FCMService } from './fcmService';
import { ChatService } from './chatService';

export interface CashOrderRequest {
  customerId: string;
  cookerId: string;
  dishes: Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    price: number;
    prepTime?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  deliveryInfo: {
    address: string;
    phone: string;
    instructions?: string;
  };
  customerName: string;
}

export class CashOrderService {
  /**
   * Create a cash-on-delivery order that requires cooker approval
   */
  static async createCashOrder(orderData: CashOrderRequest): Promise<string | null> {
    try {
      // Generate delivery code
      const deliveryCode = Math.random().toString(36).substr(2, 8).toUpperCase();

      // Create order with pending_approval status
      const order = {
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        cookerId: orderData.cookerId,
        dishes: orderData.dishes,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        serviceFee: orderData.serviceFee,
        total: orderData.total,
        paymentMethod: 'cash_on_delivery' as const,
        paymentStatus: 'cash_pending' as const,
        status: 'pending_approval' as const,
        deliveryInfo: orderData.deliveryInfo,
        deliveryCode,
        isDelivered: false,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      const orderId = await OrdersService.createOrder(order);
      
      if (orderId) {
        // Send notification to cooker
        await this.notifyCookerForApproval(orderId, orderData.cookerId, orderData.customerName, orderData.total);
        
        // Create order chat room
        await ChatService.getOrCreateOrderChatRoom(orderId, orderData.cookerId, orderData.customerId);
        
        console.log('Cash order created successfully:', orderId);
      }

      return orderId;
    } catch (error) {
      console.error('Error creating cash order:', error);
      return null;
    }
  }

  /**
   * Send notification to cooker for order approval
   */
  static async notifyCookerForApproval(
    orderId: string, 
    cookerId: string, 
    customerName: string, 
    orderTotal: number
  ): Promise<void> {
    try {
      const formattedTotal = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(orderTotal);

      await FCMService.sendOrderStatusNotification(
        cookerId,
        {
          title: '🔔 Nueva Orden - Pago en Efectivo',
          body: `${customerName} quiere pagar ${formattedTotal} en efectivo. ¿Aceptas?`,
          image: '/llama-icon.jpg'
        },
        {
          orderId,
          type: 'cash_order_approval',
          actionUrl: `/cooker/dashboard?tab=orders&orderId=${orderId}`,
          priority: 'high'
        }
      );

      // Also send system message to chat
      const chatRoomId = await ChatService.getOrCreateOrderChatRoom(orderId, cookerId, customerName);
      if (chatRoomId) {
        await ChatService.sendSystemMessage(
          chatRoomId,
          `Nueva orden con pago en efectivo (${formattedTotal}). El cocinero debe aprobar antes de proceder.`,
          { orderId, type: 'cash_order_created' }
        );
      }
    } catch (error) {
      console.error('Error sending cooker approval notification:', error);
    }
  }

  /**
   * Cooker approves the cash order
   */
  static async approveCashOrder(orderId: string, cookerId: string): Promise<boolean> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      await updateDoc(orderRef, {
        status: 'accepted',
        'cookerApproval.approved': true,
        'cookerApproval.approvedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Get order details for notifications
      const order = await OrdersService.getOrderById(orderId);
      if (!order) return false;

      // Notify customer that order was approved
      await FCMService.sendOrderStatusNotification(
        order.customerId,
        {
          title: '✅ Orden Aprobada',
          body: 'Tu orden con pago en efectivo ha sido aprobada y está siendo preparada.',
          image: '/llama-icon.jpg'
        },
        {
          orderId,
          type: 'cash_order_approved',
          actionUrl: `/orders/${orderId}/tracking`,
          priority: 'high'
        }
      );

      // Send system message to chat
      const chatRoomId = await ChatService.getOrCreateOrderChatRoom(orderId, cookerId, order.customerId);
      if (chatRoomId) {
        await ChatService.sendSystemMessage(
          chatRoomId,
          'Orden aprobada y aceptada. El cocinero comenzará la preparación.',
          { orderId, type: 'cash_order_approved' }
        );
      }

      console.log('Cash order approved:', orderId);
      return true;
    } catch (error) {
      console.error('Error approving cash order:', error);
      return false;
    }
  }

  /**
   * Cooker rejects the cash order
   */
  static async rejectCashOrder(
    orderId: string, 
    cookerId: string, 
    reason?: string
  ): Promise<boolean> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      await updateDoc(orderRef, {
        status: 'rejected',
        'cookerApproval.approved': false,
        'cookerApproval.rejectedAt': serverTimestamp(),
        'cookerApproval.rejectionReason': reason || 'No especificado',
        updatedAt: serverTimestamp()
      });

      // Get order details for notifications
      const order = await OrdersService.getOrderById(orderId);
      if (!order) return false;

      // Notify customer that order was rejected
      await FCMService.sendOrderStatusNotification(
        order.customerId,
        {
          title: '❌ Orden Rechazada',
          body: `Tu orden fue rechazada. Razón: ${reason || 'No especificada'}`,
          image: '/llama-icon.jpg'
        },
        {
          orderId,
          type: 'cash_order_rejected',
          actionUrl: `/orders/${orderId}`,
          priority: 'high'
        }
      );

      // Send system message to chat
      const chatRoomId = await ChatService.getOrCreateOrderChatRoom(orderId, cookerId, order.customerId);
      if (chatRoomId) {
        await ChatService.sendSystemMessage(
          chatRoomId,
          `Orden rechazada. Razón: ${reason || 'No especificada'}`,
          { orderId, type: 'cash_order_rejected' }
        );
      }

      console.log('Cash order rejected:', orderId);
      return true;
    } catch (error) {
      console.error('Error rejecting cash order:', error);
      return false;
    }
  }

  /**
   * Mark cash payment as completed when delivered
   */
  static async completeCashPayment(orderId: string): Promise<boolean> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      await updateDoc(orderRef, {
        paymentStatus: 'paid',
        isDelivered: true,
        status: 'delivered',
        actualDeliveryTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Cash payment completed for order:', orderId);
      return true;
    } catch (error) {
      console.error('Error completing cash payment:', error);
      return false;
    }
  }
}