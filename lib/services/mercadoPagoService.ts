'use client';

// import { MercadoPago } from '@mercadopago/sdk-react';

export interface PaymentData {
  amount: number;
  description: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface PaymentResult {
  id: string;
  status: string;
  detail: string;
  payment_method_id: string;
  payment_type_id: string;
}

export class MercadoPagoService {
  private static publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
  private static initialized = false;

  static initialize() {
    if (!this.publicKey) {
      console.error('Mercado Pago public key not found in environment variables');
      return false;
    }

    if (!this.initialized) {
      // Initialize Mercado Pago only on client side
      if (typeof window !== 'undefined') {
        this.initialized = true;
      }
    }
    return true;
  }

  static async createPreference(paymentData: PaymentData) {
    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment preference');
      }

      const preference = await response.json();
      return preference;
    } catch (error) {
      console.error('Error creating payment preference:', error);
      throw error;
    }
  }

  static async processPayment(paymentData: any) {
    try {
      const response = await fetch('/api/mercadopago/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  static async getPaymentStatus(paymentId: string) {
    try {
      const response = await fetch(`/api/mercadopago/payment-status/${paymentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      const status = await response.json();
      return status;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  static getPaymentStatusText(status: string): string {
    switch (status) {
      case 'approved':
        return 'Pago aprobado';
      case 'pending':
        return 'Pago pendiente';
      case 'in_process':
        return 'Pago en proceso';
      case 'rejected':
        return 'Pago rechazado';
      case 'cancelled':
        return 'Pago cancelado';
      case 'refunded':
        return 'Pago reembolsado';
      case 'charged_back':
        return 'Contracargo';
      default:
        return 'Estado desconocido';
    }
  }

  static getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'pending':
      case 'in_process':
        return 'text-yellow-600';
      case 'rejected':
      case 'cancelled':
        return 'text-red-600';
      case 'refunded':
      case 'charged_back':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  }

  // Helper method to format currency for Chilean market
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Convert Chilean pesos to the currency expected by Mercado Pago
  static convertCurrency(amountCLP: number): number {
    // Mercado Pago in Chile works with CLP directly
    return Math.round(amountCLP);
  }

  // Create a payment reservation (authorization without capture)
  static async createPaymentReservation(paymentData: PaymentData) {
    try {
      const response = await fetch('/api/mercadopago/create-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment reservation');
      }

      const reservation = await response.json();
      return reservation;
    } catch (error) {
      console.error('Error creating payment reservation:', error);
      throw error;
    }
  }

  // Capture a previously authorized payment
  static async capturePayment(paymentId: string, amount?: number) {
    try {
      const response = await fetch('/api/mercadopago/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId, amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to capture payment');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  }

  // Cancel a payment authorization
  static async cancelPaymentAuthorization(paymentId: string) {
    try {
      const response = await fetch('/api/mercadopago/cancel-authorization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel payment authorization');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error canceling payment authorization:', error);
      throw error;
    }
  }

  // Process a refund for a completed payment
  static async refundPayment(paymentId: string, amount?: number) {
    try {
      const response = await fetch('/api/mercadopago/refund-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId, amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Create a preference with authorization-only (hold) mode
  static async createPreferenceWithHold(paymentData: PaymentData) {
    try {
      const response = await fetch('/api/mercadopago/create-preference-hold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment preference with hold');
      }

      const preference = await response.json();
      return preference;
    } catch (error) {
      console.error('Error creating payment preference with hold:', error);
      throw error;
    }
  }
}