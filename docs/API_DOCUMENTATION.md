# 🔥 Moai API Documentation

Comprehensive API documentation for the Moai food delivery platform.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Orders API](#orders-api)
- [Dishes API](#dishes-api)
- [Users API](#users-api)
- [Payments API](#payments-api)
- [Notifications API](#notifications-api)
- [Health & Monitoring](#health--monitoring)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All protected endpoints require Firebase Authentication token in the `Authorization` header.

```http
Authorization: Bearer <firebase-jwt-token>
```

### User Roles
- `client` - End customers
- `cooker` - Food preparers
- `driver` - Delivery personnel
- `admin` - Platform administrators

---

## 📦 Orders API

### Create Order
```http
POST /api/orders/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "customerId": "string",
  "cookerId": "string", 
  "dishes": [
    {
      "dishId": "string",
      "quantity": number,
      "price": number,
      "customizations": "string?"
    }
  ],
  "deliveryAddress": {
    "street": "string",
    "city": "string",
    "coordinates": {
      "lat": number,
      "lng": number
    }
  },
  "paymentMethod": "card" | "cash_on_delivery",
  "specialInstructions": "string?",
  "total": number,
  "deliveryFee": number
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "string",
  "estimatedDelivery": "ISO8601",
  "deliveryCode": "string"
}
```

### Get Order Status
```http
GET /api/orders/{orderId}/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "orderId": "string",
  "status": "pending" | "accepted" | "preparing" | "ready" | "delivering" | "delivered",
  "estimatedTime": "ISO8601",
  "driverInfo": {
    "name": "string",
    "phone": "string",
    "location": {
      "lat": number,
      "lng": number
    }
  }
}
```

### Update Order Status (Cooks/Drivers only)
```http
PUT /api/orders/{orderId}/status
Authorization: Bearer <token>

{
  "status": "accepted" | "preparing" | "ready" | "delivering" | "delivered",
  "estimatedReadyTime": "ISO8601?",
  "notes": "string?"
}
```

### Cancel Order (Customers only)
```http
DELETE /api/orders/{orderId}
Authorization: Bearer <token>

{
  "reason": "string"
}
```

---

## 🍽️ Dishes API

### Get All Dishes
```http
GET /api/dishes?category={category}&available={boolean}&cookerId={id}
```

**Query Parameters:**
- `category` - Filter by dish category
- `available` - Filter by availability (default: true)
- `cookerId` - Filter by specific cook
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Pagination offset

### Get Single Dish
```http
GET /api/dishes/{dishId}
```

### Create Dish (Cooks only)
```http
POST /api/dishes/create
Authorization: Bearer <token>

{
  "name": "string",
  "description": "string",
  "category": "string",
  "price": number,
  "preparationTime": number,
  "images": ["string"],
  "ingredients": ["string"],
  "allergens": ["string"],
  "isAvailable": boolean,
  "maxOrdersPerDay": number?
}
```

### Update Dish (Cooks only)
```http
PUT /api/dishes/{dishId}
Authorization: Bearer <token>

{
  "name": "string?",
  "description": "string?",
  "price": number?,
  "isAvailable": boolean?
}
```

### Delete Dish (Cooks only)
```http
DELETE /api/dishes/{dishId}
Authorization: Bearer <token>
```

---

## 👥 Users API

### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>

{
  "displayName": "string?",
  "phone": "string?",
  "address": {
    "street": "string",
    "city": "string",
    "coordinates": {
      "lat": number,
      "lng": number
    }
  }
}
```

### Update User Role (Admin only)
```http
PUT /api/auth/update-role
Authorization: Bearer <admin-token>

{
  "userId": "string",
  "role": "client" | "cooker" | "driver" | "admin"
}
```

---

## 💳 Payments API

### Create Payment Preference (MercadoPago)
```http
POST /api/mercadopago/create-preference
Authorization: Bearer <token>

{
  "orderId": "string",
  "amount": number,
  "description": "string",
  "payerEmail": "string"
}
```

**Response:**
```json
{
  "preferenceId": "string",
  "initPoint": "string",
  "sandboxInitPoint": "string"
}
```

### Payment Webhook (MercadoPago)
```http
POST /api/mercadopago/webhook
Content-Type: application/json

{
  "action": "string",
  "data": {
    "id": "string"
  },
  "type": "payment"
}
```

### Get Payment Status
```http
GET /api/mercadopago/payment-status/{paymentId}
Authorization: Bearer <token>
```

### Refund Payment (Admin only)
```http
POST /api/mercadopago/refund-payment
Authorization: Bearer <admin-token>

{
  "paymentId": "string",
  "amount": number?
}
```

---

## 🔔 Notifications API

### Send Push Notification
```http
POST /api/fcm/send
Authorization: Bearer <admin-token>

{
  "userId": "string",
  "title": "string",
  "body": "string",
  "data": object?
}
```

### Subscribe to Topic
```http
POST /api/fcm/subscribe
Authorization: Bearer <token>

{
  "topic": "string",
  "token": "string"
}
```

### Send Email Notification
```http
POST /api/email/send-order-notification
Authorization: Bearer <token>

{
  "type": "order_confirmation" | "order_status" | "welcome",
  "recipientEmail": "string",
  "orderData": object
}
```

---

## 🏥 Health & Monitoring

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "ISO8601",
  "services": {
    "database": "ok",
    "payment": "ok",
    "notifications": "ok"
  }
}
```

### Service Status (Admin only)
```http
GET /api/admin/system-status
Authorization: Bearer <admin-token>
```

---

## ⚠️ Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error context"
  },
  "timestamp": "ISO8601",
  "requestId": "string"
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNAVAILABLE` (503) - External service down

---

## 🚦 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Anonymous users**: 100 requests/hour
- **Authenticated users**: 1000 requests/hour  
- **Admin users**: 5000 requests/hour

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## 🔄 Real-time Features

### WebSocket Connections

Connect to real-time updates:

```javascript
const ws = new WebSocket('wss://moai-wheat.vercel.app/ws')

// Order status updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'orders',
  orderId: 'order-123'
}))

// GPS tracking updates  
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'tracking',
  orderId: 'order-123'
}))
```

### Firestore Listeners

For web clients, use Firebase SDK for real-time updates:

```javascript
import { onSnapshot, doc } from 'firebase/firestore'

// Listen to order changes
onSnapshot(doc(db, 'orders', orderId), (doc) => {
  console.log('Order updated:', doc.data())
})
```

---

## 📚 SDKs and Integrations

### JavaScript/TypeScript
```bash
npm install @moai/api-client
```

```javascript
import { MoaiAPI } from '@moai/api-client'

const api = new MoaiAPI({
  baseURL: 'https://moai-wheat.vercel.app',
  apiKey: 'your-api-key'
})

// Create order
const order = await api.orders.create({
  customerId: 'user-123',
  dishes: [...]
})
```

### React Hooks
```javascript
import { useOrders, useOrderStatus } from '@moai/react-hooks'

function OrderTracker({ orderId }) {
  const { order, loading } = useOrderStatus(orderId)
  
  return (
    <div>Status: {order?.status}</div>
  )
}
```

---

## 🔗 Webhook Events

Moai sends webhooks for important events:

### Order Events
- `order.created`
- `order.status_changed`
- `order.delivered`
- `order.cancelled`

### Payment Events  
- `payment.completed`
- `payment.failed`
- `payment.refunded`

### Example Webhook Payload
```json
{
  "event": "order.status_changed",
  "timestamp": "2024-01-20T15:30:00Z",
  "data": {
    "orderId": "order-123",
    "oldStatus": "preparing",
    "newStatus": "ready",
    "customerId": "user-456"
  },
  "signature": "sha256=..."
}
```

---

## 📞 Support

- **API Issues**: api@moai.com
- **Documentation**: docs@moai.com
- **Status Page**: https://status.moai.com
- **Discord**: https://discord.gg/moai

---

*Last updated: 2024-01-20*