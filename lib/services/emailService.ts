import { Order, Cook } from '@/lib/firebase/dataService';

export class EmailService {
  /**
   * Send order notification email to cook
   */
  static async sendOrderNotificationToCook(
    order: Order, 
    cook: Cook
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/email/send-order-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cookEmail: cook.email,
          cookName: cook.displayName || cook.name,
          orderId: order.id,
          customerName: order.customerName,
          dishes: order.dishes,
          total: order.total,
          deliveryAddress: order.deliveryInfo.address,
          orderDate: order.createdAt?.toDate().toISOString() || new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Email sent successfully:', result);
      return true;

    } catch (error) {
      console.error('Error sending order notification email:', error);
      return false;
    }
  }

  /**
   * Send order confirmation email to customer
   */
  static async sendOrderConfirmationToCustomer(
    order: Order,
    cookName: string
  ): Promise<boolean> {
    try {
      // This would be implemented similarly to cook notification
      // For now, just log the action
      console.log(`Order confirmation email would be sent to customer for order ${order.id}`);
      return true;
    } catch (error) {
      console.error('Error sending customer confirmation email:', error);
      return false;
    }
  }

  /**
   * Send order status update email
   */
  static async sendOrderStatusUpdate(
    order: Order,
    newStatus: string,
    recipientEmail: string,
    recipientName: string
  ): Promise<boolean> {
    try {
      // This would send status update emails (accepted, ready, etc.)
      console.log(`Status update email would be sent to ${recipientEmail} for order ${order.id} - status: ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Error sending status update email:', error);
      return false;
    }
  }
}