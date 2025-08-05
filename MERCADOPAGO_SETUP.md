# Mercado Pago Setup Guide

This guide explains how to configure Mercado Pago for the LicanÑam app.

## 1. Create Mercado Pago Developer Account

1. Go to [Mercado Pago Developers](https://www.mercadopago.com.cl/developers)
2. Sign in or create an account
3. Go to "Tus aplicaciones" (Your applications)
4. Create a new application

## 2. Get Your Credentials

From your Mercado Pago developer dashboard:

### Test Credentials (For Development)
- **Public Key**: Starts with `TEST-` (used in frontend)
- **Access Token**: Starts with `TEST-` (used in backend)

### Production Credentials (For Live Environment)
- **Public Key**: Starts with `APP_USR-` (used in frontend)
- **Access Token**: Starts with `APP_USR-` (used in backend)

## 3. Configure Environment Variables

Update your `.env.local` file with your credentials:

```env
# Mercado Pago Configuration
MERCADO_PAGO_ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="YOUR_PUBLIC_KEY_HERE"
NEXTAUTH_URL="http://localhost:3000"
```

### Important Notes:
- Use **TEST** credentials for development
- Use **production** credentials only when ready to go live
- Never commit real credentials to version control
- The `NEXTAUTH_URL` should match your domain (localhost for dev, your domain for production)

## 4. Test the Integration

1. Start your development server: `npm run dev`
2. Add items to cart and proceed to checkout
3. Fill in delivery information
4. Click "Place Order" - you should be redirected to Mercado Pago
5. Use test cards provided by Mercado Pago for testing

## 5. Test Cards (Chile)

For testing payments in Chile, use these official Mercado Pago test cards:

### Credit Cards
- **Mastercard**: 5416 7526 0258 2580
  - CVV: 123
  - Expiry: 11/30

- **Visa**: 4168 8188 4444 7115
  - CVV: 123
  - Expiry: 11/30

- **American Express**: 3757 781744 61804
  - CVV: 1234
  - Expiry: 11/30

### Debit Cards
- **Mastercard Débito**: 5241 0198 2664 6950
  - CVV: 123
  - Expiry: 11/30

- **Visa Débito**: 4023 6535 2391 4373
  - CVV: 123
  - Expiry: 11/30

### Test Results
- All cards above will result in **approved** payments
- Use any valid name for the cardholder
- Use any valid Chilean RUT when prompted

## 6. Webhook Configuration (Optional)

If you need real-time payment notifications:

1. In Mercado Pago dashboard, go to "Webhooks"
2. Add your webhook URL: `https://yourdomain.com/api/mercadopago/webhook`
3. Select payment events you want to receive

## 7. Go Live Checklist

Before switching to production:

- [ ] Replace TEST credentials with production credentials
- [ ] Update `NEXTAUTH_URL` to your production domain
- [ ] Test all payment flows thoroughly
- [ ] Configure webhook URLs for production
- [ ] Verify SSL certificate is valid
- [ ] Test with real payment methods

## Support

- [Mercado Pago Chile Documentation](https://www.mercadopago.com.cl/developers/es/docs)
- [Test Credentials](https://www.mercadopago.com.cl/developers/es/docs/checkout-api/additional-content/test-cards)
- [Webhook Documentation](https://www.mercadopago.com.cl/developers/es/docs/your-integrations/notifications/webhooks)