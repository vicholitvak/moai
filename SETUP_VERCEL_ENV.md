# 🔐 Configuración de Variables de Entorno en Vercel

## 📋 Variables Requeridas

### Para que la app funcione, necesitas configurar estas variables en Vercel:

---

## 1️⃣ Variables de Firebase Client (OBLIGATORIAS)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### ¿Dónde obtenerlas?

1. 🔗 [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. ⚙️ **Project Settings** (icono de engranaje)
4. Pestaña **General**
5. Sección **"Your apps"** → encuentra tu Web app
6. Si no tienes una, click **"Add app"** → **Web** (icono `</>`)**
7. Verás un código como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",                    // 👈 NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "tu-proyecto.firebaseapp.com",  // 👈 NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "tu-proyecto",                // 👈 NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "tu-proyecto.appspot.com",   // 👈 NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",          // 👈 NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc123"          // 👈 NEXT_PUBLIC_FIREBASE_APP_ID
};
```

---

## 2️⃣ Variables de Firebase Admin (Opcional - Para Server-Side)

```bash
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTuClavePrivada\n-----END PRIVATE KEY-----\n"
```

### ¿Dónde obtenerlas?

1. Firebase Console → ⚙️ **Project Settings**
2. Pestaña **"Service Accounts"**
3. Sección **"Firebase Admin SDK"**
4. Click **"Generate new private key"**
5. Se descargará un archivo JSON tipo: `tu-proyecto-firebase-adminsdk-xxx.json`

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto",              // 👈 FIREBASE_PROJECT_ID
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",  // 👈 FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xxx@tu-proyecto.iam.gserviceaccount.com",  // 👈 FIREBASE_CLIENT_EMAIL
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

---

## 3️⃣ Otras Variables Opcionales

### Mercado Pago (Si usas pagos)
```bash
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx-xxx
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx-xxx
```

### Google Maps (Si usas mapas de Google en vez de Leaflet)
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

### Sentry (Si usas error tracking)
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### App Config
```bash
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
NODE_ENV=production
```

---

## 📲 Cómo Agregar en Vercel Dashboard

### Paso a Paso:

1. **Ve a tu proyecto en Vercel:**
   ```
   https://vercel.com/dashboard
   ```

2. **Selecciona tu proyecto** (moai-app o el nombre que hayas usado)

3. **Ve a Settings:**
   - Click en **"Settings"** en la barra superior

4. **Abre Environment Variables:**
   - En el menú lateral, click **"Environment Variables"**

5. **Agrega cada variable:**
   
   Para cada variable:
   
   a) Click en **"Add New"**
   
   b) En **"Name"**, pon el nombre exacto (ej: `NEXT_PUBLIC_FIREBASE_API_KEY`)
   
   c) En **"Value"**, pega el valor
   
   d) En **"Environments"**, selecciona:
      - ☑️ **Production** (siempre)
      - ☑️ **Preview** (recomendado)
      - ☐ **Development** (opcional)
   
   e) Click **"Save"**
   
   f) Repite para cada variable

6. **Redeploy:**
   - Ve a **"Deployments"**
   - En el último deployment, click en los **"..."** (tres puntos)
   - Click **"Redeploy"**
   - Confirma **"Redeploy"**

---

## 🎯 Ejemplo de Configuración Completa

Así debería verse tu página de Environment Variables:

```
┌────────────────────────────────────────────────────────┐
│ Environment Variables                                   │
├────────────────────────────────────────────────────────┤
│                                                         │
│ NEXT_PUBLIC_FIREBASE_API_KEY                          │
│ AIzaSyB...xyz123                                       │
│ Production, Preview                                    │
│                                                         │
│ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN                      │
│ tu-proyecto.firebaseapp.com                           │
│ Production, Preview                                    │
│                                                         │
│ NEXT_PUBLIC_FIREBASE_PROJECT_ID                       │
│ tu-proyecto-id                                        │
│ Production, Preview                                    │
│                                                         │
│ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET                   │
│ tu-proyecto.appspot.com                               │
│ Production, Preview                                    │
│                                                         │
│ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID              │
│ 123456789                                             │
│ Production, Preview                                    │
│                                                         │
│ NEXT_PUBLIC_FIREBASE_APP_ID                           │
│ 1:123456789:web:abc123                                │
│ Production, Preview                                    │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Verificación

### Después de configurar, verifica:

1. **Ve a Deployments**
2. El último deployment debería ser **"Ready"** (verde)
3. Click en el URL del deployment
4. Abre la consola del navegador (F12)
5. No deberías ver errores de Firebase

### Si ves errores:

```javascript
// ❌ Error: Firebase not initialized
// Significa que faltan variables o están mal

// ✅ Sin errores de Firebase
// Todo está bien configurado
```

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE:

- ✅ **SÍ puedes** poner las variables `NEXT_PUBLIC_*` (son públicas)
- ❌ **NO pongas** en el código las que NO tienen `NEXT_PUBLIC_*`
- ❌ **NO subas** archivos `.env` a GitHub
- ✅ **SÍ usa** `.env.local` para desarrollo local (ya está en .gitignore)
- ✅ **SÍ usa** Vercel Environment Variables para producción

---

## 📝 Para Desarrollo Local

Si quieres probar localmente, crea un archivo `.env.local`:

```bash
# Copia este archivo como .env.local
# .env.local está en .gitignore y NO se subirá a GitHub

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=tu_valor_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_valor_aqui
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_valor_aqui
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_valor_aqui
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_valor_aqui
NEXT_PUBLIC_FIREBASE_APP_ID=tu_valor_aqui

# Firebase Admin (Opcional)
FIREBASE_PROJECT_ID=tu_valor_aqui
FIREBASE_CLIENT_EMAIL=tu_valor_aqui
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave_aqui\n-----END PRIVATE KEY-----\n"
```

Luego:
```bash
npm run dev
```

---

## 🆘 Troubleshooting

### Error: "Firebase not initialized"
- **Solución:** Verifica que TODAS las variables `NEXT_PUBLIC_FIREBASE_*` estén configuradas

### Error: "Invalid API key"
- **Solución:** Copia de nuevo el API key desde Firebase Console

### Error: "Auth domain not authorized"
- **Solución:** 
  1. Firebase Console → Authentication → Settings
  2. "Authorized domains" → Add domain
  3. Agrega: `tu-app.vercel.app`

### Deploy funciona pero la app no carga:
- **Solución:** Abre la consola (F12) y revisa los errores. Probablemente faltan variables.

---

## 🎉 ¡Listo!

Una vez configuradas las variables, tu app debería funcionar perfectamente en Vercel.

### Siguiente paso:
Prueba tu app en: `https://tu-app.vercel.app`

---

*Última actualización: ${new Date().toLocaleDateString('es-CL')}*
