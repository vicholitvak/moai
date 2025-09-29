# 🔥 URGENTE: Actualizar FIREBASE_PRIVATE_KEY en GitHub

## ❌ Problema Actual

El secreto `FIREBASE_PRIVATE_KEY` en GitHub tiene los saltos de línea como texto literal (`\n`) en lugar de saltos de línea reales. Firebase no puede leer la clave en ese formato.

**Error actual:**
```
Error initializing Firebase Admin: Error: Failed to parse private key: Error: Only 8, 16, 24, or 32 bits supported: 56
```

---

## ✅ Solución

### Paso 1: Abrir el archivo con la clave correcta

He creado el archivo `FIREBASE_PRIVATE_KEY_GITHUB.txt` con los saltos de línea **REALES**.

```powershell
notepad FIREBASE_PRIVATE_KEY_GITHUB.txt
```

### Paso 2: Ir a GitHub Secrets

Abre este enlace:
```
https://github.com/vicholitvak/moai/settings/secrets/actions
```

### Paso 3: Actualizar el secreto FIREBASE_PRIVATE_KEY

1. **Busca** `FIREBASE_PRIVATE_KEY` en la lista
2. **Click en el lápiz** (ícono de editar) a la derecha
3. **Borra** el contenido actual
4. **Abre** `FIREBASE_PRIVATE_KEY_GITHUB.txt` con Notepad
5. **Selecciona TODO** (Ctrl+A)
6. **Copia** (Ctrl+C)
7. **Pega** en el campo "Value" de GitHub Secret
8. **Verifica** que se vea así:

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
(muchas líneas)
...
-----END PRIVATE KEY-----
```

**IMPORTANTE:** 
- ✅ DEBE tener múltiples líneas (no todo en una línea)
- ✅ NO debe tener `\n` visible
- ✅ Cada línea debe ser de ~64 caracteres
- ❌ NO agregar comillas al inicio o final
- ❌ NO agregar espacios extra

9. **Click en "Update secret"**

### Paso 4: Verificar que NO haya espacios o comillas extra

Después de pegar, revisa que:
- No haya espacios al inicio o final
- No haya comillas (`"`) alrededor de la clave
- Los saltos de línea se vean como líneas separadas

---

## 🔄 Cambios Adicionales Realizados

También corregí el workflow de GitHub Actions (`.github/workflows/ci.yml`):

**ANTES (incorrecto):**
```yaml
FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMockKeyForBuildOnly\n-----END PRIVATE KEY-----\n' }}
```

**AHORA (correcto):**
```yaml
FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
```

Removí el fallback con valor mock que estaba causando problemas.

---

## 🚀 Próximos Pasos

Una vez que actualices el secreto en GitHub:

1. **Hacer push** del workflow corregido:
   ```powershell
   git add .github/workflows/ci.yml
   git commit -m "fix: Remover fallbacks mock del workflow CI/CD"
   git push origin main
   ```

2. **Re-ejecutar el workflow:**
   - Ve a: https://github.com/vicholitvak/moai/actions
   - Click en el workflow más reciente
   - Click en "Re-run all jobs"

3. **Verificar los logs:**
   Deberías ver:
   ```
   ✅ Firebase Admin initialized successfully
   ```

---

## 📊 Cómo Verificar que el Secreto está Correcto

Después de actualizar el secreto, el workflow debería:

1. **Instalar dependencias** ✅
2. **Inicializar Firebase Admin** ✅
   ```
   ✅ Firebase Admin initialized successfully
   ```
3. **Compilar la aplicación** ✅
   ```
   ✓ Compiled successfully
   ```
4. **Generar páginas estáticas** ✅

---

## 🆘 Si Aún Falla

Si después de actualizar el secreto el error persiste:

1. **Verifica que el secreto sea exactamente:**
   - Nombre: `FIREBASE_PRIVATE_KEY` (sin espacios, mayúsculas)
   - Valor: Múltiples líneas con saltos de línea reales

2. **Descarga tu Service Account Key de Firebase:**
   - Ve a: https://console.firebase.google.com/project/hometaste-tlpog/settings/serviceaccounts/adminsdk
   - Click en "Generate new private key"
   - Abre el archivo JSON descargado
   - Copia el valor del campo `"private_key"`
   - Úsalo como el secreto en GitHub (con saltos de línea reales)

3. **Compara con el archivo local:**
   ```powershell
   # Ver la clave en .env.local (con \n escapados)
   Select-String -Path .env.local -Pattern "FIREBASE_PRIVATE_KEY"
   ```

---

## ✅ Checklist Final

- [ ] Abrí `FIREBASE_PRIVATE_KEY_GITHUB.txt`
- [ ] Copié TODO el contenido
- [ ] Fui a GitHub Secrets
- [ ] Actualicé `FIREBASE_PRIVATE_KEY`
- [ ] Verifiqué que tenga líneas separadas (no `\n` literales)
- [ ] Guardé el secreto
- [ ] Hice push del workflow corregido
- [ ] Re-ejecuté el workflow en GitHub Actions
- [ ] El build pasó con ✅

---

**Última actualización:** ${new Date().toLocaleString('es-CL')}
