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

    console.log('Capturing MercadoPago payment:', {
      paymentId,
      amount,
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
    console.log('Payment status before capture:', paymentData.status);

    if (paymentData.status !== 'authorized') {
      return NextResponse.json(
        { error: `Payment is not in authorized state. Current status: ${paymentData.status}` },
        { status: 400 }
      );
    }

    // Capture the authorized payment
    const capturePayload: any = {
      transaction_amount: amount ?? paymentData.transaction_amount,
      capture: true
    };

    console.log('Capture payload:', capturePayload);

    const captureResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(capturePayload),
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error('MercadoPago capture error:', {
        status: captureResponse.status,
        statusText: captureResponse.statusText,
        body: errorText
      });
      throw new Error(`MercadoPago capture error: ${captureResponse.status} - ${errorText}`);
    }

    const captureResult = await captureResponse.json();
    console.log('Payment capture result:', captureResult);

    return NextResponse.json({
      success: true,
      paymentId: captureResult.id,
      status: captureResult.status,
      status_detail: captureResult.status_detail,
      transaction_amount: captureResult.transaction_amount,
      captured_amount: amount ?? captureResult.transaction_amount,
      capture_date: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error capturing payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to capture payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}