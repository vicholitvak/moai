import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    hasMercadoPagoToken: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
    tokenLength: process.env.MERCADO_PAGO_ACCESS_TOKEN?.length ?? 0,
    tokenStart: process.env.MERCADO_PAGO_ACCESS_TOKEN?.substring(0, 20) ?? 'undefined',
    hasPublicKey: !!process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
    publicKeyStart: process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.substring(0, 20) ?? 'undefined'
  });
}