import { NextRequest, NextResponse } from 'next/server';
import { OrdersService } from '@/lib/firebase/dataService';

// Using MercadoPago REST API directly instead of SDK to avoid build issues
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    console.log('Mercado Pago webhook received:', body);

    // Validate the webhook
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // Get payment details from Mercado Pago using REST API
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`MercadoPago API error: ${response.status}`);
      }

      const paymentData = await response.json();
      
      console.log('Payment data:', paymentData);
      
      const orderId = paymentData.external_reference;
      const status = paymentData.status;
      
      // Update order status based on payment status
      let orderStatus: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
      
      switch (status) {
        case 'approved':
          orderStatus = 'accepted';
          break;
        case 'pending':
        case 'in_process':
          orderStatus = 'pending';
          break;
        case 'rejected':
        case 'cancelled':
          orderStatus = 'cancelled';
          break;
        default:
          orderStatus = 'pending';
      }
      
      // Update the order in Firebase
      if (orderId) {
        try {
          await OrdersService.updateOrderStatus(orderId, orderStatus);
          console.log(`Order ${orderId} updated to status: ${orderStatus}`);
        } catch (error) {
          console.error('Error updating order status:', error);
        }
      }
      
      // Store payment information (you might want to create a payments collection)
      console.log(`Payment ${paymentId} processed: ${status}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}