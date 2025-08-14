# Configuración de Email para Notificaciones

## Variables de Entorno Requeridas

Para que el sistema de notificaciones por email funcione correctamente, necesitas agregar las siguientes variables a tu archivo `.env.local`:

```env
# Email Configuration (Gmail ejemplo)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password-de-gmail

# Base URL para los enlaces en los emails
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
```

## Configuración de Gmail

### 1. Activar Verificación de 2 Pasos
- Ve a [Google Account Settings](https://myaccount.google.com/)
- Seguridad → Verificación de 2 pasos → Activar

### 2. Generar App Password
- En Seguridad → Verificación de 2 pasos
- App passwords → Seleccionar app: Mail
- Seleccionar dispositivo: Other (custom name) → "Moai App"
- Copia la contraseña generada (16 caracteres)

### 3. Configurar Variables
```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password-de-16-caracteres
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Para desarrollo
```

## Otras Opciones de Email

### Resend (Recomendado para producción)
```env
RESEND_API_KEY=tu-resend-api-key
EMAIL_FROM=noreply@tu-dominio.com
```

### SendGrid
```env
SENDGRID_API_KEY=tu-sendgrid-api-key
EMAIL_FROM=noreply@tu-dominio.com
```

## Funcionalidad Implementada

### Al crear un pedido:
1. ✅ Se envía email automático al cocinero
2. ✅ Email incluye detalles completos del pedido
3. ✅ Botones directos para confirmar/rechazar
4. ✅ Enlaces van directo al dashboard del cocinero

### Template de Email incluye:
- 🍽️ Información completa del pedido
- 👥 Datos del cliente y dirección
- 📋 Lista detallada de platos
- 💰 Total del pedido
- ⏰ Tiempo límite para responder (15 min)
- ✅ Botón "Confirmar Pedido"
- ❌ Botón "Rechazar Pedido"
- 🔗 Enlace al dashboard

### Flujo de confirmación:
1. Cocinero recibe email → Click en botón
2. Abre dashboard con acción automática
3. Pedido se actualiza en tiempo real
4. Toast notification confirma la acción
5. URL se limpia automáticamente

## Testing

Para probar en desarrollo:
```bash
# 1. Configurar variables en .env.local
EMAIL_USER=tu-gmail@gmail.com
EMAIL_PASSWORD=tu-app-password
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 2. Crear un pedido de prueba
# El email se enviará automáticamente al cocinero

# 3. Revisar logs en consola para confirmación
```

## Seguridad

- ✅ App passwords en lugar de contraseña principal
- ✅ Variables de entorno para credenciales
- ✅ Validación de parámetros en API
- ✅ Error handling sin exponer credenciales
- ✅ Enlaces con tokens de acción directa

## Monitoreo

Logs incluidos para:
- Envío exitoso de emails
- Errores de configuración
- Acciones desde emails (confirm/reject)
- Fallos en entrega de emails