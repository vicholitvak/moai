import { NextRequest, NextResponse } from 'next/server';

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { paymentId, amount } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log('Processing MercadoPago refund:', {
      paymentId,
      amount,
      hasAccessToken: !!MERCADO_PAGO_ACCESS_TOKEN
    });

    // First, get the payment details to ensure it's refundable
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
    console.log('Payment status before refund:', paymentData.status);

    if (paymentData.status !== 'approved') {
      return NextResponse.json(
        { error: `Payment is not refundable. Current status: ${paymentData.status}` },
        { status: 400 }
      );
    }

    // Create refund
    const refundPayload: any = {};
    
    // If partial refund amount is specified, include it
    if (amount && amount < paymentData.transaction_amount) {
      refundPayload.amount = amount;
    }

    console.log('Refund payload:', refundPayload);

    const refundResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refundPayload),
    });

    if (!refundResponse.ok) {
      const errorText = await refundResponse.text();
      console.error('MercadoPago refund error:', {
        status: refundResponse.status,
        statusText: refundResponse.statusText,
        body: errorText
      });
      throw new Error(`MercadoPago refund error: ${refundResponse.status} - ${errorText}`);
    }

    const refundResult = await refundResponse.json();
    console.log('Payment refund result:', refundResult);

    return NextResponse.json({
      success: true,
      refundId: refundResult.id,
      paymentId: paymentId,
      status: refundResult.status,
      amount: refundResult.amount,
      refund_date: refundResult.date_created,
      source_id: refundResult.source_id
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process refund',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}