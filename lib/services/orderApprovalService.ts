import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { OrdersService } from '@/lib/firebase/dataService';
import { FCMService } from './fcmService';
import { ChatService } from './chatService';
import { MercadoPagoService } from './mercadoPagoService';

export interface OrderApprovalData {
  orderId: string;
  cookerId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentMethod: 'card' | 'cash_on_delivery';
  paymentId?: string; // For digital payments
  estimatedPrepTime?: number; // in minutes
}

export class OrderApprovalService {
  /**
   * Approve an order (works for both cash and digital payments)
   */
  static async approveOrder(
    orderId: string, 
    cookerId: string, 
    estimatedPrepTime: number = 30
  ): Promise<boolean> {
    try {
      // Get order details
      const order = await OrdersService.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update order status
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'accepted',
        'cookerApproval.approved': true,
        'cookerApproval.approvedAt': serverTimestamp(),
        estimatedPrepTime: estimatedPrepTime,
        estimatedDeliveryTime: new Date(Date.now() + estimatedPrepTime * 60000),
        updatedAt: serverTimestamp()
      });

      // Handle payment processing based on method
      if (order.paymentMethod === 'card' && order.paymentId) {
        // Release payment hold for digital payments
        await this.releasePaymentHold(order.paymentId);
        
        // Update payment status
        await updateDoc(orderRef, {
          paymentStatus: 'paid'
        });
      } else if (order.paymentMethod === 'cash_on_delivery') {
        // Keep cash_pending status for cash orders
        await updateDoc(orderRef, {
          paymentStatus: 'cash_pending'
        });
      }

      // Send approval notifications
      await this.sendApprovalNotifications(order, estimatedPrepTime);

      console.log('Order approved successfully:', orderId);
      return true;
    } catch (error) {
      console.error('Error approving order:', error);
      return false;
    }
  }

  /**
   * Reject an order with reason
   */
  static async rejectOrder(
    orderId: string, 
    cookerId: string, 
    reason: string
  ): Promise<boolean> {
    try {
      // Get order details
      const order = await OrdersService.getOrderById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update order status
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'rejected',
        'cookerApproval.approved': false,
        'cookerApproval.rejectedAt': serverTimestamp(),
        'cookerApproval.rejectionReason': reason,
        updatedAt: serverTimestamp()
      });

      // Handle payment refund for digital payments
      if (order.paymentMethod === 'card' && order.paymentId) {
        await this.refundPayment(order.paymentId);
        
        await updateDoc(orderRef, {
          paymentStatus: 'failed'
        });
      }

      // Send rejection notifications
      await this.sendRejectionNotifications(order, reason);

      console.log('Order rejected successfully:', orderId);
      return true;
    } catch (error) {
      console.error('Error rejecting order:', error);
      return false;
    }
  }

  /**
   * Create an order with pending approval status
   */
  static async createOrderWithApproval(orderData: any): Promise<string | null> {
    try {
      // Set initial status based on payment method
      const enhancedOrderData = {
        ...orderData,
        status: 'pending_approval',
        paymentStatus: orderData.paymentMethod === 'card' ? 'pending' : 'cash_pending',
        cookerApproval: {
          approved: false
        },
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      const orderId = await OrdersService.createOrder(enhancedOrderData);
      
      if (orderId) {
        // Send notification to cooker
        await this.notifyCookerForApproval(
          orderId, 
          orderData.cookerId, 
          orderData.customerName, 
          orderData.total,
          orderData.paymentMethod
        );
        
        // Create order chat room
        await ChatService.getOrCreateOrderChatRoom(
          orderId, 
          orderData.cookerId, 
          orderData.customerId
        );
      }

      return orderId;
    } catch (error) {
      console.error('Error creating order with approval:', error);
      return null;
    }
  }

  /**
   * Release payment hold for approved digital payments
   */
  private static async releasePaymentHold(paymentId: string): Promise<void> {
    try {
      // Implementation depends on MercadoPago API for releasing holds
      // This would typically involve calling their capture payment endpoint
      console.log('Releasing payment hold for:', paymentId);
      
      // For now, we'll just log this as the MercadoPago integration 
      // would need specific implementation based on their hold/capture flow
    } catch (error) {
      console.error('Error releasing payment hold:', error);
    }
  }

  /**
   * Refund payment for rejected orders
   */
  private static async refundPayment(paymentId: string): Promise<void> {
    try {
      console.log('Processing refund for payment:', paymentId);
      
      // Implementation would use MercadoPago refund API
      // await MercadoPagoService.refundPayment(paymentId);
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  }

  /**
   * Send notifications when order is approved
   */
  private static async sendApprovalNotifications(
    order: any, 
    estimatedPrepTime: number
  ): Promise<void> {
    try {
      const estimatedDeliveryTime = new Date(Date.now() + estimatedPrepTime * 60000);
      const timeString = estimatedDeliveryTime.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Push notification to customer
      await FCMService.sendOrderStatusNotification(
        order.customerId,
        {
          title: '✅ ¡Orden Aprobada y Aceptada!',
          body: `Tu orden ha sido aprobada. Tiempo estimado: ${estimatedPrepTime} min. Entrega aprox: ${timeString}`,
          image: '/llama-icon.jpg'
        },
        {
          orderId: order.id,
          type: 'order_approved',
          actionUrl: `/orders/${order.id}/tracking`,
          priority: 'high',
          estimatedDeliveryTime: estimatedDeliveryTime.toISOString()
        }
      );

      // Chat message
      const chatRoomId = await ChatService.getOrCreateOrderChatRoom(
        order.id, 
        order.cookerId, 
        order.customerId
      );
      
      if (chatRoomId) {
        await ChatService.sendSystemMessage(
          chatRoomId,
          `🎉 ¡Orden aprobada! El cocinero comenzará la preparación. Tiempo estimado: ${estimatedPrepTime} minutos. Entrega aproximada: ${timeString}`,
          { 
            orderId: order.id, 
            type: 'order_approved',
            estimatedPrepTime,
            estimatedDeliveryTime: estimatedDeliveryTime.toISOString()
          }
        );
      }

      // Email notification (to be implemented)
      await this.sendApprovalEmail(order, estimatedPrepTime);

    } catch (error) {
      console.error('Error sending approval notifications:', error);
    }
  }

  /**
   * Send notifications when order is rejected
   */
  private static async sendRejectionNotifications(
    order: any, 
    reason: string
  ): Promise<void> {
    try {
      // Push notification to customer
      await FCMService.sendOrderStatusNotification(
        order.customerId,
        {
          title: '❌ Orden Rechazada',
          body: `Lo sentimos, tu orden fue rechazada. Razón: ${reason}`,
          image: '/llama-icon.jpg'
        },
        {
          orderId: order.id,
          type: 'order_rejected',
          actionUrl: `/orders/${order.id}`,
          priority: 'high'
        }
      );

      // Chat message
      const chatRoomId = await ChatService.getOrCreateOrderChatRoom(
        order.id, 
        order.cookerId, 
        order.customerId
      );
      
      if (chatRoomId) {
        await ChatService.sendSystemMessage(
          chatRoomId,
          `❌ Orden rechazada. Razón: ${reason}. ${order.paymentMethod === 'card' ? 'Se procesará el reembolso automáticamente.' : ''}`,
          { 
            orderId: order.id, 
            type: 'order_rejected',
            rejectionReason: reason
          }
        );
      }

      // Email notification (to be implemented)
      await this.sendRejectionEmail(order, reason);

    } catch (error) {
      console.error('Error sending rejection notifications:', error);
    }
  }

  /**
   * Send notification to cooker for approval
   */
  private static async notifyCookerForApproval(
    orderId: string, 
    cookerId: string, 
    customerName: string, 
    orderTotal: number,
    paymentMethod: 'card' | 'cash_on_delivery'
  ): Promise<void> {
    try {
      const formattedTotal = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(orderTotal);

      const paymentText = paymentMethod === 'card' ? 'Pago Digital' : 'Pago en Efectivo';

      await FCMService.sendOrderStatusNotification(
        cookerId,
        {
          title: '🔔 Nueva Orden - Requiere Aprobación',
          body: `${customerName} - ${formattedTotal} (${paymentText}). ¿Aceptas la orden?`,
          image: '/llama-icon.jpg'
        },
        {
          orderId,
          type: 'order_approval_required',
          actionUrl: `/cooker/dashboard?tab=orders&orderId=${orderId}`,
          priority: 'high',
          paymentMethod
        }
      );

    } catch (error) {
      console.error('Error sending cooker approval notification:', error);
    }
  }

  /**
   * Send approval email to customer
   */
  private static async sendApprovalEmail(
    order: any, 
    estimatedPrepTime: number
  ): Promise<void> {
    try {
      // This would integrate with an email service like SendGrid, Resend, etc.
      console.log('Sending approval email to:', order.customerEmail || order.customerId);
      
      // Email content would include:
      // - Order approved confirmation
      // - Estimated prep time
      // - Tracking link
      // - Payment confirmation (if digital)
      
    } catch (error) {
      console.error('Error sending approval email:', error);
    }
  }

  /**
   * Send rejection email to customer
   */
  private static async sendRejectionEmail(
    order: any, 
    reason: string
  ): Promise<void> {
    try {
      console.log('Sending rejection email to:', order.customerEmail || order.customerId);
      
      // Email content would include:
      // - Order rejection notice
      // - Reason for rejection
      // - Refund information (if applicable)
      // - Alternative suggestions
      
    } catch (error) {
      console.error('Error sending rejection email:', error);
    }
  }
}