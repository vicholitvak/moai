import { NextRequest, NextResponse } from 'next/server';
import { createMonitoredApiHandler, withPaymentMonitoring } from '@/lib/middleware/monitoringMiddleware';
import { monitoring } from '@/lib/services/monitoringService';

// Using MercadoPago REST API directly instead of SDK to avoid build issues
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

async function createPreferenceHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { amount, description, orderId, customerEmail, customerName, items } = body;

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    // Track payment creation attempt
    monitoring.trackPayment(amount, 'CLP', 'mercadopago', true);

    console.log('Creating MercadoPago preference with:', {
      amount,
      description,
      orderId,
      customerEmail,
      customerName,
      items,
      hasAccessToken: !!MERCADO_PAGO_ACCESS_TOKEN,
      baseUrl
    });

    // Create preference - simplified to match working curl example
    const preference = {
      items: items.map((item: { id: string; title: string; quantity: number; unit_price: number }) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'CLP',
      })),
      back_urls: {
        success: `${baseUrl}/payment/success`,
        failure: `${baseUrl}/payment/failure`,
        pending: `${baseUrl}/payment/pending`,
      },
      external_reference: orderId,
    };

    console.log('Preference object:', JSON.stringify(preference, null, 2));

    // Use MercadoPago REST API with monitoring
    const preferenceData = await withPaymentMonitoring(async () => {
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

      return await response.json();
    }, 'create_preference');

    // Track successful payment creation
    monitoring.trackEvent({
      category: 'payment',
      action: 'preference_created',
      label: orderId,
      value: amount,
      metadata: {
        preferenceId: preferenceData.id,
        customerEmail,
        itemCount: items.length,
      },
    });

    return NextResponse.json({
      preferenceId: preferenceData.id,
      initPoint: preferenceData.init_point,
      sandboxInitPoint: preferenceData.sandbox_init_point,
    });
  } catch (error) {
    console.error('Error creating preference:', error);

    // Track payment creation failure
    monitoring.trackPayment(0, 'CLP', 'mercadopago', false);
    monitoring.trackError(error as Error, {
      endpoint: '/api/mercadopago/create-preference',
      operation: 'create_preference',
    });

    return NextResponse.json(
      { error: 'Failed to create payment preference' },
      { status: 500 }
    );
  }
}

// Wrap with monitoring middleware
export const POST = createMonitoredApiHandler(createPreferenceHandler, {
  trackPerformance: true,
  trackErrors: true,
});