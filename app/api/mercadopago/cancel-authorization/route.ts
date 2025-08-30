import { NextRequest, NextResponse } from 'next/server';

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log('Canceling MercadoPago payment authorization:', {
      paymentId,
      hasAccessToken: !!MERCADO_PAGO_ACCESS_TOKEN
    });

    // First, get the payment details to ensure it's in authorized state
    const paymentStatusResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentStatusResponse.ok) {
      const errorText = await paymentStatusResponse.text();
      console.error('Error getting payment status:', errorText);
      throw new Error(`Failed to get payment status: ${paymentStatusResponse.status}`);
    }

    const paymentData = await paymentStatusResponse.json();
    console.log('Payment status before cancellation:', paymentData.status);

    if (paymentData.status !== 'authorized') {
      return NextResponse.json(
        { error: `Payment is not in authorized state. Current status: ${paymentData.status}` },
        { status: 400 }
      );
    }

    // Cancel the authorized payment
    const cancelPayload = {
      status: 'cancelled'
    };

    console.log('Cancel payload:', cancelPayload);

    const cancelResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cancelPayload),
    });

    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      console.error('MercadoPago cancel error:', {
        status: cancelResponse.status,
        statusText: cancelResponse.statusText,
        body: errorText
      });
      throw new Error(`MercadoPago cancel error: ${cancelResponse.status} - ${errorText}`);
    }

    const cancelResult = await cancelResponse.json();
    console.log('Payment cancellation result:', cancelResult);

    return NextResponse.json({
      success: true,
      paymentId: cancelResult.id,
      status: cancelResult.status,
      status_detail: cancelResult.status_detail,
      cancellation_date: new Date().toISOString(),
      transaction_amount: cancelResult.transaction_amount
    });

  } catch (error) {
    console.error('Error canceling payment authorization:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel payment authorization',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}