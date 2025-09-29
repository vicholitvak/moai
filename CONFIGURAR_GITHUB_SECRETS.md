# 🔐 Configurar Secretos de Firebase en GitHub Actions

## 📋 Resumen
Para que GitHub Actions pueda hacer build de tu aplicación, necesita tener acceso a las credenciales de Firebase Admin. Actualmente está usando valores mock que causan este error:

```
❌ Error initializing Firebase Admin: Error: Failed to parse private key: Error: Only 8, 16, 24, or 32 bits supported: 56
```

## ✅ Solución: Agregar Secretos Reales

### 🔑 Secretos Necesarios

Debes agregar estos 3 secretos en tu repositorio de GitHub:

#### 1. **FIREBASE_PROJECT_ID**
```
hometaste-tlpog
```

#### 2. **FIREBASE_CLIENT_EMAIL**
```
firebase-adminsdk-fbsvc@hometaste-tlpog.iam.gserviceaccount.com
```

#### 3. **FIREBASE_PRIVATE_KEY**
Esta clave está guardada en el archivo `github_private_key.txt` en la raíz de tu proyecto.
- Ábrelo con un editor de texto
- Copia **TODO** el contenido (incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)
- También puedes encontrarla en tu archivo `.env.local`

---

## 🚀 Pasos para Agregar los Secretos

### Opción 1: Usando la Interfaz Web (Recomendado)

1. **Ve a la página de secretos de tu repositorio:**
   ```
   https://github.com/vicholitvak/moai/settings/secrets/actions
   ```

2. **Click en el botón verde "New repository secret"**

3. **Agrega cada secreto uno por uno:**

   **Para FIREBASE_PROJECT_ID:**
   - Name: `FIREBASE_PROJECT_ID`
   - Secret: `hometaste-tlpog`
   - Click "Add secret"

   **Para FIREBASE_CLIENT_EMAIL:**
   - Name: `FIREBASE_CLIENT_EMAIL`
   - Secret: `firebase-adminsdk-fbsvc@hometaste-tlpog.iam.gserviceaccount.com`
   - Click "Add secret"

   **Para FIREBASE_PRIVATE_KEY:**
   - Name: `FIREBASE_PRIVATE_KEY`
   - Secret: Abre `github_private_key.txt` y copia TODO su contenido
   - **IMPORTANTE:** Asegúrate de copiar desde `-----BEGIN PRIVATE KEY-----` hasta `-----END PRIVATE KEY-----`
   - GitHub manejará automáticamente los saltos de línea
   - Click "Add secret"

4. **Verifica que los 3 secretos estén agregados:**
   Deberías ver una lista con:
   - ✅ FIREBASE_PROJECT_ID
   - ✅ FIREBASE_CLIENT_EMAIL
   - ✅ FIREBASE_PRIVATE_KEY

---

### Opción 2: Usando GitHub CLI (Si lo tienes instalado)

```bash
# Instalar GitHub CLI si no lo tienes
winget install --id GitHub.cli

# Autenticarte
gh auth login

# Agregar secretos (desde la raíz del proyecto)
gh secret set FIREBASE_PROJECT_ID -b"hometaste-tlpog"
gh secret set FIREBASE_CLIENT_EMAIL -b"firebase-adminsdk-fbsvc@hometaste-tlpog.iam.gserviceaccount.com"
gh secret set FIREBASE_PRIVATE_KEY < github_private_key.txt
```

---

## 🔄 Después de Agregar los Secretos

Una vez que hayas agregado los 3 secretos:

1. **Ve a la pestaña "Actions" de tu repositorio:**
   ```
   https://github.com/vicholitvak/moai/actions
   ```

2. **Busca el workflow que falló** (el más reciente con ❌)

3. **Click en "Re-run all jobs"** (botón en la parte superior derecha)

4. **El build ahora debería pasar exitosamente** ✅

---

## 📊 Verificación

Para verificar que todo funciona:

1. Después de re-ejecutar el workflow, el build debería mostrar:
   ```
   ✅ Firebase Admin initialized successfully
   ```

2. En lugar del error anterior:
   ```
   ❌ Error initializing Firebase Admin: Error: Failed to parse private key...
   ```

---

## 🧹 Limpieza (Importante)

Después de agregar los secretos a GitHub, **ELIMINA** el archivo `github_private_key.txt`:

```bash
# En PowerShell
Remove-Item github_private_key.txt -Force

# O simplemente bórralo desde el explorador de archivos
```

**NO** hagas commit de este archivo al repositorio.

---

## ℹ️ Información Adicional

### ¿Por qué son necesarios estos secretos?

Tu aplicación usa Firebase Admin SDK en el servidor para:
- Autenticación de usuarios
- Verificación de tokens
- Envío de notificaciones push (FCM)
- Operaciones de Firestore desde el servidor

Sin estas credenciales, estas funciones no funcionarán durante el build ni en producción.

### ¿Son seguros los secretos en GitHub?

✅ **Sí**, GitHub Actions encripta todos los secretos y nunca los muestra en los logs.
✅ Solo tu repositorio tiene acceso a estos secretos.
✅ No aparecerán en los archivos de build públicos.

### ¿Qué pasa en Vercel?

Las variables de entorno en Vercel ya están configuradas (las agregamos con `vercel env add`).
Los secretos de GitHub son **solo** para que GitHub Actions pueda hacer el build en CI/CD.

---

## 🆘 Solución de Problemas

### El workflow sigue fallando después de agregar los secretos

1. Verifica que los nombres de los secretos sean **exactamente**:
   - `FIREBASE_PROJECT_ID` (no `FIREBASE-PROJECT-ID` ni `Firebase_Project_Id`)
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

2. Asegúrate de haber copiado **toda** la private key, incluyendo:
   ```
   -----BEGIN PRIVATE KEY-----
   [contenido largo de la clave]
   -----END PRIVATE KEY-----
   ```

3. Re-ejecuta el workflow (no solo hagas push, re-ejecuta el workflow que falló)

### No puedo acceder a la página de secretos

Necesitas ser el **propietario** o tener permisos de **administrador** del repositorio.
Si no tienes acceso, contacta al propietario del repositorio.

---

## ✅ Checklist Final

- [ ] Agregué `FIREBASE_PROJECT_ID` en GitHub Secrets
- [ ] Agregué `FIREBASE_CLIENT_EMAIL` en GitHub Secrets
- [ ] Agregué `FIREBASE_PRIVATE_KEY` en GitHub Secrets (con BEGIN y END)
- [ ] Verifiqué que los 3 secretos aparecen en la lista
- [ ] Re-ejecuté el workflow que falló
- [ ] El build pasó exitosamente ✅
- [ ] Eliminé el archivo `github_private_key.txt`

---

**¡Listo!** 🎉 Tu CI/CD ahora puede hacer builds exitosos con Firebase Admin.
