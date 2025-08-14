import { NextRequest, NextResponse } from 'next/server';

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, orderId, customerEmail, customerName, items } = body;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    console.log('Creating MercadoPago preference with authorization hold:', {
      amount,
      description,
      orderId,
      customerEmail,
      customerName,
      items,
      hasAccessToken: !!MERCADO_PAGO_ACCESS_TOKEN,
      baseUrl
    });

    // Create preference with authorization-only mode (payment hold)
    const preference = {
      items: items.map((item: { id: string; title: string; quantity: number; unit_price: number }) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'CLP',
      })),
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 1, // Only allow single payment to simplify authorization
      },
      back_urls: {
        success: `${baseUrl}/payment/success?hold=true&order_id=${orderId}`,
        failure: `${baseUrl}/payment/failure?order_id=${orderId}`,
        pending: `${baseUrl}/payment/pending?hold=true&order_id=${orderId}`,
      },
      auto_return: 'approved',
      external_reference: orderId,
      notification_url: `${baseUrl}/api/mercadopago/webhook?type=hold`,
      // Enable authorization mode (this requires special MercadoPago account configuration)
      capture: false, // This tells MP to authorize but not capture immediately
      metadata: {
        approval_required: true,
        order_id: orderId,
        payment_type: 'authorization_hold'
      }
    };

    console.log('Preference object with hold:', JSON.stringify(preference, null, 2));

    // Use MercadoPago REST API directly
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MercadoPago API error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`MercadoPago API error: ${response.status} - ${errorText}`);
    }

    const preferenceData = await response.json();
    
    return NextResponse.json({
      preferenceId: preferenceData.id,
      initPoint: preferenceData.init_point,
      sandboxInitPoint: preferenceData.sandbox_init_point,
      isHoldMode: true,
    });
  } catch (error) {
    console.error('Error creating preference with hold:', error);
    return NextResponse.json(
      { error: 'Failed to create payment preference with authorization hold' },
      { status: 500 }
    );
  }
}