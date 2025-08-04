import { NextRequest, NextResponse } from 'next/server';

// Using MercadoPago REST API directly instead of SDK to avoid build issues
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, orderId, customerEmail, customerName, items } = body;

    // Create preference
    const preference = {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'CLP', // Chilean peso
      })),
      payer: {
        email: customerEmail,
        name: customerName,
      },
      payment_methods: {
        excluded_payment_methods: [
          // You can exclude specific payment methods if needed
        ],
        excluded_payment_types: [
          // You can exclude specific payment types if needed
        ],
        installments: 12, // Max installments
      },
      back_urls: {
        success: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment/success`,
        failure: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment/failure`,
        pending: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment/pending`,
      },
      auto_return: 'approved',
      external_reference: orderId,
      notification_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mercadopago/webhook`,
      statement_descriptor: 'MOAI DELIVERY',
      metadata: {
        order_id: orderId,
      },
    };

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
      throw new Error(`MercadoPago API error: ${response.status}`);
    }

    const preferenceData = await response.json();
    
    return NextResponse.json({
      preferenceId: preferenceData.id,
      initPoint: preferenceData.init_point,
      sandboxInitPoint: preferenceData.sandbox_init_point,
    });
  } catch (error) {
    console.error('Error creating preference:', error);
    return NextResponse.json(
      { error: 'Failed to create payment preference' },
      { status: 500 }
    );
  }
}