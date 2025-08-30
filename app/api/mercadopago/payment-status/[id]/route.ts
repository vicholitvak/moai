import { NextRequest, NextResponse } from 'next/server';

// Using MercadoPago REST API directly instead of SDK to avoid build issues
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const paymentId = resolvedParams.id;
    
    // Use MercadoPago REST API directly
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
    
    return NextResponse.json({
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      payment_method_id: paymentData.payment_method_id,
      payment_type_id: paymentData.payment_type_id,
      transaction_amount: paymentData.transaction_amount,
      currency_id: paymentData.currency_id,
      date_created: paymentData.date_created,
      date_approved: paymentData.date_approved,
      external_reference: paymentData.external_reference,
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}