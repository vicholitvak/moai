# 🔑 Agregar Secretos Públicos de Firebase a GitHub

## ✅ Progreso Actual

- ✅ Firebase Admin inicializado correctamente
- ✅ FIREBASE_PRIVATE_KEY funciona perfectamente
- ❌ Faltan variables públicas de Firebase Client

## ❌ Error Actual

```
Error [FirebaseError]: Firebase: Error (auth/invalid-api-key).
```

Esto ocurre porque las rutas API que usan Firebase Client SDK no tienen las credenciales.

---

## 🚀 Solución Rápida

Necesitas agregar **6 secretos más** en GitHub:

### Ir a GitHub Secrets:
```
https://github.com/vicholitvak/moai/settings/secrets/actions
```

### Secretos a Agregar:

#### 1. NEXT_PUBLIC_FIREBASE_API_KEY
```
AIzaSyBptLm3y63BDBH9Xgt_UY40ZjsgUvMOKGI
```

#### 2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
```
hometaste-tlpog.firebaseapp.com
```

#### 3. NEXT_PUBLIC_FIREBASE_PROJECT_ID
```
hometaste-tlpog
```

#### 4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
```
hometaste-tlpog.firebasestorage.app
```

#### 5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
```
72297856520
```

#### 6. NEXT_PUBLIC_FIREBASE_APP_ID
```
1:72297856520:web:c7d851e4c00c67ec419bbd
```

---

## 📋 Proceso para Cada Secreto:

1. Click en **"New repository secret"**
2. **Name:** Copia el nombre exacto (ej: `NEXT_PUBLIC_FIREBASE_API_KEY`)
3. **Secret:** Copia el valor correspondiente
4. Click en **"Add secret"**
5. Repite para los 6 secretos

---

## ⏱️ Tiempo Estimado

~5 minutos para agregar los 6 secretos

---

## ✅ Verificación

Después de agregar los 6 secretos, deberías tener en total **9 secretos**:

### Secretos de Firebase Admin (ya configurados ✅):
- ✅ FIREBASE_PROJECT_ID
- ✅ FIREBASE_CLIENT_EMAIL
- ✅ FIREBASE_PRIVATE_KEY

### Secretos de Firebase Client (a agregar):
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID

---

## 🔄 Después de Agregar los Secretos

1. **Re-ejecutar el workflow:**
   - Ve a: https://github.com/vicholitvak/moai/actions
   - Click en el workflow más reciente
   - Click en "Re-run all jobs"

2. **Verificar que el build pase:**
   - Todos los checks deberían pasar ✅
   - El deploy a Vercel se hará automáticamente

---

## 💡 Nota sobre Seguridad

Estos valores son "públicos" (NEXT_PUBLIC_*) porque se exponen en el cliente.
No son sensibles como la PRIVATE_KEY, pero aún así deben estar en GitHub Secrets
para mantener la configuración centralizada y segura.

---

**¿Listo para agregar los secretos?** Ve a la página de secretos y agrega los 6 valores listados arriba.
