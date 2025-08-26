// Professional Email Templates for Moai App

export interface EmailTemplateData {
  // User info
  userName?: string;
  userEmail?: string;
  
  // Order info
  orderId?: string;
  orderTotal?: string;
  orderItems?: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  orderStatus?: string;
  estimatedDelivery?: string;
  deliveryAddress?: string;
  
  // Cook info
  cookName?: string;
  cookAvatar?: string;
  cookRating?: string;
  
  // Driver info
  driverName?: string;
  driverPhone?: string;
  
  // Support info
  ticketId?: string;
  supportMessage?: string;
  
  // Review info
  reviewRating?: number;
  reviewComment?: string;
  
  // App URLs
  appUrl?: string;
  orderTrackingUrl?: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
}

// Base email wrapper with consistent styling
function createEmailWrapper(content: string, data: EmailTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Moai - Comida Casera</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #F57C00 0%, #FF8F00 100%);
      color: white;
      padding: 30px 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #2c3e50;
    }
    .main-content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #F57C00;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #E65100;
    }
    .order-details {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .order-item:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 16px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-pending { background-color: #fff3cd; color: #856404; }
    .status-accepted { background-color: #d1ecf1; color: #0c5460; }
    .status-preparing { background-color: #f8d7da; color: #721c24; }
    .status-ready { background-color: #d4edda; color: #155724; }
    .status-delivering { background-color: #e2e3e5; color: #383d41; }
    .status-delivered { background-color: #d1ecf1; color: #0c5460; }
    .footer {
      background-color: #f8f9fa;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #dee2e6;
    }
    .footer p {
      margin: 5px 0;
      font-size: 14px;
      color: #6c757d;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      padding: 8px;
      background-color: #F57C00;
      color: white;
      text-decoration: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      text-align: center;
      line-height: 24px;
    }
    .rating {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .star {
      color: #ffc107;
      font-size: 16px;
    }
    @media (max-width: 600px) {
      .container {
        margin: 0;
        box-shadow: none;
      }
      .header, .content, .footer {
        padding: 20px;
      }
      .order-item {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍽️ Moai</h1>
      <p>Comida casera, hecha con amor</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="#">📱</a>
        <a href="#">📧</a>
        <a href="#">🌐</a>
      </div>
      <p><strong>Moai - Conectando cocineros con hogares</strong></p>
      <p>© 2024 Moai. Todos los derechos reservados.</p>
      <p>
        <a href="${data.supportUrl || '#'}" style="color: #F57C00; text-decoration: none;">Centro de Ayuda</a> |
        <a href="${data.unsubscribeUrl || '#'}" style="color: #6c757d; text-decoration: none;">Desuscribirse</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Order confirmation email
export function createOrderConfirmationEmail(data: EmailTemplateData): string {
  const content = `
    <div class="greeting">
      ¡Hola ${data.userName}! 👋
    </div>
    
    <div class="main-content">
      <h2>¡Tu pedido ha sido confirmado!</h2>
      <p>Hemos recibido tu pedido correctamente. Aquí tienes los detalles:</p>
      
      <div class="order-details">
        <h3>Pedido #${data.orderId}</h3>
        <p><strong>Estado:</strong> <span class="status-badge status-pending">Pendiente de Aprobación</span></p>
        <p><strong>Dirección de entrega:</strong> ${data.deliveryAddress}</p>
        <p><strong>Tiempo estimado:</strong> ${data.estimatedDelivery}</p>
        
        <h4>Artículos:</h4>
        ${data.orderItems?.map(item => `
          <div class="order-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>${item.price}</span>
          </div>
        `).join('') || ''}
        
        <div class="order-item">
          <span><strong>Total</strong></span>
          <span><strong>${data.orderTotal}</strong></span>
        </div>
      </div>
      
      <p>El cocinero <strong>${data.cookName}</strong> revisará tu pedido y te notificaremos cuando sea aprobado.</p>
      
      <div style="text-align: center;">
        <a href="${data.orderTrackingUrl}" class="button">
          📱 Seguir Pedido
        </a>
      </div>
    </div>
    
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>💡 Consejo:</strong> Puedes seguir el estado de tu pedido en tiempo real desde la app.</p>
    </div>
  `;
  
  return createEmailWrapper(content, data);
}

// Order status update email
export function createOrderStatusEmail(data: EmailTemplateData): string {
  const statusMessages = {
    accepted: {
      title: '✅ ¡Tu pedido ha sido aceptado!',
      message: `${data.cookName} ha aceptado tu pedido y comenzará a prepararlo pronto.`,
      emoji: '👨‍🍳'
    },
    preparing: {
      title: '👨‍🍳 Tu pedido se está preparando',
      message: `${data.cookName} está cocinando tu pedido con mucho cariño.`,
      emoji: '🔥'
    },
    ready: {
      title: '🍽️ ¡Tu pedido está listo!',
      message: 'Tu comida está lista. Estamos buscando un conductor para la entrega.',
      emoji: '🚀'
    },
    delivering: {
      title: '🚗 Tu pedido está en camino',
      message: `${data.driverName} está en camino con tu pedido.`,
      emoji: '📍'
    },
    delivered: {
      title: '🎉 ¡Pedido entregado!',
      message: 'Tu pedido ha sido entregado exitosamente. ¡Que lo disfrutes!',
      emoji: '✨'
    }
  };
  
  const statusInfo = statusMessages[data.orderStatus as keyof typeof statusMessages] || statusMessages.accepted;
  
  const content = `
    <div class="greeting">
      ¡Hola ${data.userName}! ${statusInfo.emoji}
    </div>
    
    <div class="main-content">
      <h2>${statusInfo.title}</h2>
      <p>${statusInfo.message}</p>
      
      <div class="order-details">
        <h3>Pedido #${data.orderId}</h3>
        <p><strong>Estado actual:</strong> <span class="status-badge status-${data.orderStatus}">${data.orderStatus?.toUpperCase()}</span></p>
        
        ${data.driverName && data.driverPhone ? `
          <div style="background-color: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4>👤 Tu conductor</h4>
            <p><strong>Nombre:</strong> ${data.driverName}</p>
            <p><strong>Teléfono:</strong> <a href="tel:${data.driverPhone}">${data.driverPhone}</a></p>
          </div>
        ` : ''}
        
        ${data.estimatedDelivery ? `
          <p><strong>⏰ Tiempo estimado:</strong> ${data.estimatedDelivery}</p>
        ` : ''}
      </div>
      
      <div style="text-align: center;">
        <a href="${data.orderTrackingUrl}" class="button">
          📍 Seguir en Tiempo Real
        </a>
      </div>
    </div>
    
    ${data.orderStatus === 'delivered' ? `
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3>🌟 ¿Cómo estuvo tu experiencia?</h3>
        <p>Tu opinión nos ayuda a mejorar y ayuda a otros usuarios.</p>
        <a href="${data.appUrl}/orders/${data.orderId}/review" class="button">
          ⭐ Dejar Reseña
        </a>
      </div>
    ` : ''}
  `;
  
  return createEmailWrapper(content, data);
}

// Welcome email for new users
export function createWelcomeEmail(data: EmailTemplateData): string {
  const content = `
    <div class="greeting">
      ¡Bienvenido/a a Moai, ${data.userName}! 🎉
    </div>
    
    <div class="main-content">
      <h2>¡Estamos emocionados de tenerte con nosotros!</h2>
      <p>Moai es una plataforma que conecta cocineros caseros talentosos con personas que buscan comida auténtica y deliciosa.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🍽️ ¿Cómo funciona Moai?</h3>
        <div style="margin: 15px 0;">
          <p><strong>1. Descubre</strong> - Explora platos únicos de cocineros en tu área</p>
          <p><strong>2. Ordena</strong> - Haz tu pedido directamente al cocinero</p>
          <p><strong>3. Disfruta</strong> - Recibe tu comida fresca y casera en tu puerta</p>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.appUrl}" class="button">
          🔥 Explorar Platos
        </a>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
        <div style="text-align: center; padding: 20px; background-color: #fff3e0; border-radius: 8px;">
          <h4>👨‍🍳 Para Cocineros</h4>
          <p>Comparte tus recetas favoritas y gana dinero desde casa</p>
        </div>
        <div style="text-align: center; padding: 20px; background-color: #e8f5e8; border-radius: 8px;">
          <h4>🚗 Para Conductores</h4>
          <p>Únete a nuestro equipo de entrega y trabaja con flexibilidad</p>
        </div>
      </div>
    </div>
    
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>💝 Oferta especial:</strong> Usa el código <strong>BIENVENIDO10</strong> en tu primer pedido y obtén 10% de descuento.</p>
    </div>
  `;
  
  return createEmailWrapper(content, data);
}

// Support ticket response email
export function createSupportResponseEmail(data: EmailTemplateData): string {
  const content = `
    <div class="greeting">
      Hola ${data.userName}, 👋
    </div>
    
    <div class="main-content">
      <h2>Hemos recibido tu consulta</h2>
      <p>Gracias por contactarnos. Hemos recibido tu mensaje y nuestro equipo de soporte lo está revisando.</p>
      
      <div class="order-details">
        <h3>Ticket #${data.ticketId}</h3>
        <p><strong>Estado:</strong> <span class="status-badge status-pending">En Revisión</span></p>
        <p><strong>Mensaje:</strong></p>
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #F57C00; margin: 10px 0;">
          "${data.supportMessage}"
        </div>
      </div>
      
      <p>Nuestro tiempo promedio de respuesta es de <strong>24-48 horas</strong>. Te contactaremos pronto con una solución.</p>
      
      <div style="text-align: center;">
        <a href="${data.supportUrl}" class="button">
          💬 Ver Estado del Ticket
        </a>
      </div>
    </div>
    
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4>📞 ¿Necesitas ayuda urgente?</h4>
      <p>Para emergencias o problemas urgentes, puedes contactarnos directamente:</p>
      <p><strong>WhatsApp:</strong> +1 234 567 890</p>
      <p><strong>Email:</strong> soporte@moai.com</p>
    </div>
  `;
  
  return createEmailWrapper(content, data);
}

// Review request email
export function createReviewRequestEmail(data: EmailTemplateData): string {
  const content = `
    <div class="greeting">
      ¡Hola ${data.userName}! ⭐
    </div>
    
    <div class="main-content">
      <h2>¿Cómo estuvo tu pedido?</h2>
      <p>Esperamos que hayas disfrutado tu comida de <strong>${data.cookName}</strong>. Tu opinión es muy valiosa para nosotros y para otros usuarios.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; display: inline-block;">
          <h3>Pedido #${data.orderId}</h3>
          <div class="rating" style="justify-content: center; margin: 10px 0;">
            <span class="star">⭐</span>
            <span class="star">⭐</span>
            <span class="star">⭐</span>
            <span class="star">⭐</span>
            <span class="star">⭐</span>
          </div>
          <p>¿Qué calificación le darías?</p>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.appUrl}/orders/${data.orderId}/review" class="button">
          ⭐ Dejar Reseña
        </a>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4>🎁 Recompensa por tu reseña</h4>
        <p>Al dejar una reseña honesta, obtienes <strong>50 puntos</strong> que puedes canjear en tu próximo pedido.</p>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
      <div style="text-align: center;">
        <h4>📱 Comparte en redes</h4>
        <p style="font-size: 14px;">Cuéntales a tus amigos sobre tu experiencia</p>
      </div>
      <div style="text-align: center;">
        <h4>🔄 Pide de nuevo</h4>
        <p style="font-size: 14px;">¿Te gustó? Encuentra más platos increíbles</p>
      </div>
    </div>
  `;
  
  return createEmailWrapper(content, data);
}

// Cook weekly summary email
export function createCookSummaryEmail(data: EmailTemplateData & {
  weeklyOrders?: number;
  weeklyEarnings?: string;
  topDish?: string;
  newReviews?: number;
  avgRating?: string;
}): string {
  const content = `
    <div class="greeting">
      ¡Hola ${data.userName}! 👨‍🍳
    </div>
    
    <div class="main-content">
      <h2>Tu resumen semanal en Moai</h2>
      <p>Aquí tienes un resumen de tu actividad en la plataforma durante esta semana.</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
        <div style="text-align: center; padding: 20px; background-color: #e3f2fd; border-radius: 8px;">
          <h3 style="margin: 0; color: #1976d2; font-size: 32px;">${data.weeklyOrders || 0}</h3>
          <p style="margin: 10px 0 0 0;"><strong>Pedidos esta semana</strong></p>
        </div>
        <div style="text-align: center; padding: 20px; background-color: #e8f5e8; border-radius: 8px;">
          <h3 style="margin: 0; color: #388e3c; font-size: 32px;">${data.weeklyEarnings || '$0'}</h3>
          <p style="margin: 10px 0 0 0;"><strong>Ganancias totales</strong></p>
        </div>
      </div>
      
      <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4>🏆 Destacados de la semana</h4>
        <p><strong>Plato más popular:</strong> ${data.topDish || 'N/A'}</p>
        <p><strong>Nuevas reseñas:</strong> ${data.newReviews || 0}</p>
        <p><strong>Calificación promedio:</strong> 
          <span class="rating">
            ${Array.from({length: Math.floor(parseFloat(data.avgRating || '0'))}, () => '⭐').join('')}
            ${data.avgRating}
          </span>
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.appUrl}/cooker/dashboard" class="button">
          📊 Ver Dashboard Completo
        </a>
      </div>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4>💡 Consejos para aumentar tus ventas</h4>
      <ul style="text-align: left; margin: 0; padding-left: 20px;">
        <li>Mantén tus platos siempre disponibles durante las horas pico</li>
        <li>Responde rápidamente a los pedidos para mejorar tu calificación</li>
        <li>Añade fotos atractivas a tus nuevos platos</li>
        <li>Interactúa con tus clientes a través del chat</li>
      </ul>
    </div>
  `;
  
  return createEmailWrapper(content, data);
}

// Promotional email template
export function createPromotionalEmail(data: EmailTemplateData & {
  promoTitle?: string;
  promoDescription?: string;
  promoCode?: string;
  discount?: string;
  validUntil?: string;
}): string {
  const content = `
    <div style="text-align: center; background: linear-gradient(135deg, #FF6B6B 0%, #F57C00 100%); color: white; padding: 30px; margin: -40px -40px 30px -40px; border-radius: 0;">
      <h1 style="margin: 0; font-size: 36px;">🎉</h1>
      <h2 style="margin: 10px 0;">${data.promoTitle || '¡Oferta Especial!'}</h2>
      <p style="margin: 0; font-size: 18px; opacity: 0.9;">${data.discount || '20%'} de descuento</p>
    </div>
    
    <div class="greeting">
      ¡Hola ${data.userName}! 
    </div>
    
    <div class="main-content">
      <h2>${data.promoDescription || 'No te pierdas esta increíble oferta'}</h2>
      
      <div style="text-align: center; background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #F57C00; margin-bottom: 20px;">Código de descuento</h3>
        <div style="background-color: white; border: 2px dashed #F57C00; padding: 20px; border-radius: 8px; display: inline-block;">
          <h1 style="margin: 0; color: #F57C00; font-family: monospace; letter-spacing: 2px;">
            ${data.promoCode || 'DESCUENTO20'}
          </h1>
        </div>
        <p style="margin-top: 15px; color: #666;">Válido hasta ${data.validUntil || 'el 31 de diciembre'}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.appUrl}" class="button" style="font-size: 18px; padding: 15px 40px;">
          🛒 Ordenar Ahora
        </a>
      </div>
      
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 30px 0;">
        <h4>📋 Términos y condiciones</h4>
        <ul style="font-size: 14px; margin: 10px 0; padding-left: 20px;">
          <li>Válido solo para nuevos pedidos</li>
          <li>No acumulable con otras ofertas</li>
          <li>Pedido mínimo de $15.000</li>
          <li>Válido en toda la plataforma</li>
        </ul>
      </div>
    </div>
  `;
  
  return createEmailWrapper(content, data);
}

// Newsletter template
export function createNewsletterEmail(data: EmailTemplateData & {
  featuredCooks?: Array<{name: string; specialty: string; rating: string}>;
  newFeatures?: string[];
  communityStats?: {totalOrders: number; activeCooks: number; happyCustomers: number};
}): string {
  const content = `
    <div class="greeting">
      ¡Hola ${data.userName}! 📰
    </div>
    
    <div class="main-content">
      <h2>Newsletter Moai - Lo mejor de esta semana</h2>
      <p>Mantente al día con las novedades, cocineros destacados y características nuevas de tu plataforma favorita.</p>
      
      ${data.featuredCooks && data.featuredCooks.length > 0 ? `
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>👨‍🍳 Cocineros Destacados</h3>
          ${data.featuredCooks.map(cook => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
              <div>
                <strong>${cook.name}</strong>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">${cook.specialty}</p>
              </div>
              <div class="rating">
                ⭐ ${cook.rating}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.newFeatures && data.newFeatures.length > 0 ? `
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>✨ Nuevas Características</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${data.newFeatures.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${data.communityStats ? `
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>📊 Nuestra Comunidad</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
            <div>
              <h4 style="margin: 0; color: #F57C00;">${data.communityStats.totalOrders}+</h4>
              <p style="margin: 5px 0; font-size: 14px;">Pedidos entregados</p>
            </div>
            <div>
              <h4 style="margin: 0; color: #F57C00;">${data.communityStats.activeCooks}+</h4>
              <p style="margin: 5px 0; font-size: 14px;">Cocineros activos</p>
            </div>
            <div>
              <h4 style="margin: 0; color: #F57C00;">${data.communityStats.happyCustomers}+</h4>
              <p style="margin: 5px 0; font-size: 14px;">Clientes felices</p>
            </div>
          </div>
        </div>
      ` : ''}
      
      <div style="text-align: center;">
        <a href="${data.appUrl}" class="button">
          🔥 Explorar Moai
        </a>
      </div>
    </div>
  `;
  
  return createEmailWrapper(content, data);
}

// Export all templates as a convenient object
export const EmailTemplates = {
  orderConfirmation: createOrderConfirmationEmail,
  orderStatus: createOrderStatusEmail,
  welcome: createWelcomeEmail,
  supportResponse: createSupportResponseEmail,
  reviewRequest: createReviewRequestEmail,
  cookSummary: createCookSummaryEmail,
  promotional: createPromotionalEmail,
  newsletter: createNewsletterEmail
};

// Utility function to send emails (to be implemented with your email service)
export async function sendEmail(
  to: string,
  subject: string,
  template: string,
  data: EmailTemplateData
): Promise<boolean> {
  try {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('Sending email to:', to);
    console.log('Subject:', subject);
    console.log('Template data:', data);
    
    // For demo purposes, just log the email content
    // In production, you'd send this through your email service
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}