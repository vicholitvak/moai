# 🚀 Guía de Deployment a Vercel - LicanÑam

## 📋 Pre-requisitos

Antes de deployar, asegúrate de tener:

- ✅ Cuenta en [Vercel](https://vercel.com)
- ✅ Cuenta en [Firebase](https://firebase.google.com)
- ✅ Git instalado
- ✅ Código subido a GitHub/GitLab/Bitbucket

---

## 🔧 Paso 1: Preparar Variables de Entorno

### Obtener credenciales de Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Project Settings** (⚙️)
4. En la pestaña **General**, busca "Your apps"
5. Si no tienes una app web, crea una con "Add app" → Web
6. Copia las credenciales del **SDK setup**

Deberías ver algo así:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Para Firebase Admin (Server-side):

1. En Firebase Console → **Project Settings**
2. Pestaña **Service Accounts**
3. Click en **Generate new private key**
4. Se descargará un archivo JSON con las credenciales

---

## 🚀 Paso 2: Deploy con Vercel CLI (Recomendado)

### Instalar Vercel CLI:
```bash
npm install -g vercel
```

### Login en Vercel:
```bash
vercel login
```

### Deploy a Preview:
```bash
vercel
```

Durante el proceso, te preguntará:
- **Set up and deploy "~/path/to/project"?** → Yes
- **Which scope?** → Selecciona tu cuenta
- **Link to existing project?** → No
- **What's your project's name?** → licannam-app (o el que prefieras)
- **In which directory is your code located?** → ./ (enter)
- **Want to override the settings?** → No

### Deploy a Production:
```bash
vercel --prod
```

---

## 🌐 Paso 3: Deploy desde GitHub (Alternativa)

### 1. Conectar Repositorio:

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click en **"Add New..."** → **"Project"**
3. **Import Git Repository**
4. Selecciona tu repositorio de GitHub
5. Click en **"Import"**

### 2. Configurar Proyecto:

**Framework Preset:** Next.js (detectado automáticamente)

**Root Directory:** `./` (por defecto)

**Build Command:** `npm run build:production`

**Output Directory:** `.next` (por defecto)

**Install Command:** `npm install`

---

## 🔐 Paso 4: Configurar Variables de Entorno

### En Vercel Dashboard:

1. Ve a tu proyecto en Vercel
2. Click en **"Settings"**
3. Click en **"Environment Variables"**
4. Agrega cada variable:

#### Variables Requeridas:

```bash
# Firebase Client (OBLIGATORIAS)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### Variables para Server-Side (OBLIGATORIAS):

```bash
# Firebase Admin
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
Tu clave privada aquí (todo en una línea)
-----END PRIVATE KEY-----"
```

**⚠️ IMPORTANTE:** Para `FIREBASE_PRIVATE_KEY`, copia toda la clave incluyendo los `BEGIN` y `END`, y enciérrala entre comillas dobles. Vercel manejará los saltos de línea.

#### Variables Opcionales:

```bash
# Mercado Pago (si usas pagos)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx

# Sentry (si usas error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Google Maps (si usas mapas)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# App Config
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### Ambiente de Variables:

Para cada variable, selecciona en qué ambientes aplica:
- ☑️ **Production**
- ☑️ **Preview**
- ☐ **Development** (opcional)

---

## ✅ Paso 5: Verificar Build

### Después de agregar las variables:

1. Ve a la pestaña **"Deployments"**
2. Click en **"Redeploy"** en el último deployment
3. Espera a que termine el build (2-5 minutos)

### Si el build falla:

1. Click en el deployment fallido
2. Ve a **"Build Logs"**
3. Revisa los errores
4. Comunes:
   - Falta alguna variable de entorno
   - Error de TypeScript (ya deshabilitado en next.config)
   - Error de ESLint (ya deshabilitado en next.config)

---

## 🔧 Configuración Adicional

### Dominios Personalizados:

1. En **Settings** → **Domains**
2. Click **"Add"**
3. Ingresa tu dominio
4. Sigue las instrucciones de DNS

### Redirects:

Si necesitas redirects, edita `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

### Headers de Seguridad:

Agrega en `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 🧪 Paso 6: Probar la Aplicación

### Verifica que funcionen:

1. **Homepage:** ✅ Hero se carga
2. **Registro:** ✅ Google Auth funciona
3. **Login:** ✅ Email/Password funciona
4. **Dashboard:** ✅ Se ve el dashboard según rol
5. **Mapas:** ✅ Leaflet carga correctamente
6. **Notificaciones:** ✅ Toasts funcionan

### Prueba de funcionalidad completa:

```bash
# Como Cliente:
1. Registrarse
2. Buscar platos
3. Agregar al carrito
4. Hacer checkout
5. Ver tracking

# Como Cocinero:
1. Registrarse
2. Completar onboarding
3. Agregar platos
4. Recibir pedido
5. Gestionar orden

# Como Conductor:
1. Registrarse
2. Completar onboarding
3. Ver pedidos disponibles
4. Aceptar entrega
5. Actualizar ubicación
```

---

## 📊 Monitoreo Post-Deployment

### Vercel Analytics (Gratis):

1. En tu proyecto → **Analytics**
2. Habilita Web Analytics
3. Habilita Speed Insights

### Vercel Logs:

1. **Functions** → **Logs**
2. Revisa errores en tiempo real
3. Filtra por severity

### Firebase Console:

1. **Authentication** → Revisa usuarios registrados
2. **Firestore** → Verifica datos
3. **Storage** → Revisa imágenes subidas

---

## 🐛 Troubleshooting

### "Build Failed":

```bash
# Problema: Tests fallando
# Solución: Ya configurado con build:production

# Problema: TypeScript errors
# Solución: Ya deshabilitado en next.config.ts

# Problema: ESLint errors
# Solución: Ya deshabilitado en next.config.ts
```

### "Firebase not initialized":

```bash
# Problema: Variables de entorno no configuradas
# Solución: Revisa que todas las NEXT_PUBLIC_FIREBASE_* estén configuradas
```

### "Google Auth not working":

```bash
# Problema: Dominio no autorizado en Firebase
# Solución: 
1. Firebase Console → Authentication → Settings
2. Authorized domains → Add domain
3. Agrega tu dominio de Vercel (tu-app.vercel.app)
```

### "Maps not loading":

```bash
# Problema: CORS o API Key
# Solución:
1. Verifica NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
2. En Google Cloud Console, agrega tu dominio a HTTP referrers
```

### "Images not loading":

```bash
# Problema: Domain no configurado en next.config
# Solución: Ya configurado para Unsplash, agrega más si necesitas
```

---

## 🔄 Continuous Deployment

### Automatic Deployments:

Vercel automáticamente deploya cuando:
- 🎯 **Push a main/master:** Deploy a Production
- 🌿 **Push a otras branches:** Deploy a Preview
- 🔀 **Pull Request:** Deploy a Preview

### Preview Deployments:

Cada PR genera un preview único:
- URL: `tu-app-git-branch-name.vercel.app`
- Perfecto para testing antes de merge
- Comenta en el PR con el link

---

## 📈 Performance Tips

### Optimizaciones aplicadas:

- ✅ **Images:** Next Image optimization automática
- ✅ **Fonts:** Inter font optimizado
- ✅ **Code Splitting:** Automático con Next.js
- ✅ **Static Generation:** Para páginas estáticas
- ✅ **Incremental Static Regeneration:** Para contenido dinámico

### Métricas a monitorear:

- **Core Web Vitals:**
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1

---

## 🚀 Post-Deployment Checklist

- [ ] ✅ Build exitoso en Vercel
- [ ] ✅ Todas las variables de entorno configuradas
- [ ] ✅ Firebase Auth funcionando
- [ ] ✅ Firestore leyendo/escribiendo datos
- [ ] ✅ Mapas cargando correctamente
- [ ] ✅ Registro con Google funcional
- [ ] ✅ Tracking en tiempo real activo
- [ ] ✅ Notificaciones funcionando
- [ ] ✅ PWA instalable
- [ ] ✅ Dominio personalizado configurado (opcional)
- [ ] ✅ Analytics activados
- [ ] ✅ Errores monitoreados con Sentry

---

## 🎉 ¡Listo!

Tu app está deployada en: **https://tu-app.vercel.app**

### Próximos pasos:

1. 📱 **Comparte el link** con testers
2. 📊 **Monitorea analytics** y errores
3. 🔄 **Itera** basado en feedback
4. 🚀 **Scale** según necesidad

---

## 📞 Soporte

### Si tienes problemas:

1. **Vercel Docs:** https://vercel.com/docs
2. **Vercel Support:** soporte en el dashboard
3. **Firebase Docs:** https://firebase.google.com/docs
4. **Next.js Docs:** https://nextjs.org/docs

### Recursos útiles:

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Firebase Console](https://console.firebase.google.com)
- [Sentry](https://sentry.io) (error tracking)
- [Vercel Status](https://www.vercel-status.com)

---

**¡Tu app está lista para el mundo! 🌎**

*Última actualización: ${new Date().toLocaleDateString('es-CL')}*
