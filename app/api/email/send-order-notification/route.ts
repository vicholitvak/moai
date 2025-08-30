import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { 
      cookEmail, 
      cookName, 
      orderId, 
      customerName, 
      dishes, 
      total, 
      deliveryAddress,
      orderDate 
    } = await request.json();

    // Validate required fields
    if (!cookEmail || !cookName || !orderId || !customerName) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Configure email transporter (using Gmail as example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASSWORD // Your Gmail app password
      }
    });

    // Base URL for dashboard links
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const confirmUrl = `${baseUrl}/cooker/dashboard?confirm=${orderId}`;
    const rejectUrl = `${baseUrl}/cooker/dashboard?reject=${orderId}`;

    // Create dishes list HTML
    const dishesHtml = dishes.map((dish: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${dish.dishName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${dish.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(dish.price * dish.quantity).toLocaleString('es-CL')}</td>
      </tr>
    `).join('');

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Pedido - Moai</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F57C00; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 0 0 8px 8px; }
          .order-info { background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .dishes-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .dishes-table th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
          .total { font-size: 18px; font-weight: bold; color: #F57C00; text-align: right; margin: 15px 0; }
          .actions { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .btn-confirm { background: #4CAF50; color: white; }
          .btn-reject { background: #f44336; color: white; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ Nuevo Pedido Recibido</h1>
            <p>Tienes un nuevo pedido esperando confirmación</p>
          </div>
          
          <div class="content">
            <h2>¡Hola ${cookName}!</h2>
            <p>Has recibido un nuevo pedido en Moai. Por favor revisa los detalles y confirma si puedes prepararlo.</p>
            
            <div class="order-info">
              <h3>📋 Detalles del Pedido</h3>
              <p><strong>Número de Pedido:</strong> #${orderId.slice(-8)}</p>
              <p><strong>Cliente:</strong> ${customerName}</p>
              <p><strong>Fecha:</strong> ${new Date(orderDate).toLocaleDateString('es-CL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p><strong>Dirección de Entrega:</strong> ${deliveryAddress}</p>
            </div>

            <h3>🍽️ Platos Solicitados</h3>
            <table class="dishes-table">
              <thead>
                <tr>
                  <th>Plato</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${dishesHtml}
              </tbody>
            </table>

            <div class="total">
              Total del Pedido: $${total.toLocaleString('es-CL')}
            </div>

            <div class="actions">
              <a href="${confirmUrl}" class="btn btn-confirm">
                ✅ Confirmar Pedido
              </a>
              <a href="${rejectUrl}" class="btn btn-reject">
                ❌ Rechazar Pedido
              </a>
            </div>

            <p style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 6px;">
              <strong>⏰ Tiempo de Respuesta:</strong> Por favor confirma o rechaza este pedido en los próximos 15 minutos para mantener una buena experiencia para el cliente.
            </p>

            <p style="text-align: center; margin-top: 20px;">
              <a href="${baseUrl}/cooker/dashboard" style="color: #F57C00; text-decoration: none;">
                🔗 Ir al Dashboard de Cocinero
              </a>
            </p>
          </div>

          <div class="footer">
            <p>Este es un email automático de Moai. No respondas a este mensaje.</p>
            <p>© ${new Date().getFullYear()} Moai - Plataforma de Delivery Artesanal</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email options
    const mailOptions = {
      from: `"Moai - Nuevo Pedido" <${process.env.EMAIL_USER}>`,
      to: cookEmail,
      subject: `🍽️ Nuevo Pedido #${orderId.slice(-8)} - Confirma tu disponibilidad`,
      html: emailHtml,
      // Text version for email clients that don't support HTML
      text: `
        Nuevo Pedido Recibido - Moai
        
        Hola ${cookName},
        
        Has recibido un nuevo pedido:
        
        Pedido: #${orderId.slice(-8)}
        Cliente: ${customerName}
        Total: $${total.toLocaleString('es-CL')}
        
        Platos:
        ${dishes.map((dish: any) => `- ${dish.dishName} x${dish.quantity}`).join('\n')}
        
        Para confirmar: ${confirmUrl}
        Para rechazar: ${rejectUrl}
        
        Dashboard: ${baseUrl}/cooker/dashboard
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado correctamente' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Error al enviar el email' },
      { status: 500 }
    );
  }
}