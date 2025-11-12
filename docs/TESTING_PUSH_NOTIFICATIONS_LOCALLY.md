# 🧪 Testing Push Notifications Locally

## ⚠️ Importante: HTTPS Requerido

Las push notifications **requieren HTTPS** para funcionar. En desarrollo local, necesitas usar una de estas opciones:

### Opción 1: Usar ngrok (Recomendado)

1. **Instalar ngrok:**
   ```bash
   # Windows (con Chocolatey)
   choco install ngrok
   
   # O descargar desde https://ngrok.com/download
   ```

2. **Iniciar tu app Next.js:**
   ```bash
   npm run dev
   ```

3. **En otra terminal, crear túnel HTTPS:**
   ```bash
   ngrok http 3000
   ```

4. **Usar la URL de ngrok:**
   - Copia la URL HTTPS que ngrok te da (ej: `https://abc123.ngrok.io`)
   - Accede a tu app usando esa URL
   - Las push notifications funcionarán con esa URL

### Opción 2: Usar localhost con flags especiales (Solo Chrome)

Chrome permite push notifications en localhost sin HTTPS:

1. Inicia tu app normalmente:
   ```bash
   npm run dev
   ```

2. Accede a `http://localhost:3000`

3. Chrome debería permitir notificaciones en localhost automáticamente

### Opción 3: Configurar HTTPS local (Avanzado)

Puedes configurar HTTPS localmente con herramientas como `mkcert`.

## 📋 Pasos para Probar

### 1. Generar VAPID Keys

```bash
npm run generate-vapid-keys
```

Copia las keys generadas.

### 2. Configurar Variables de Entorno

Crea o actualiza `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui
VAPID_EMAIL=mailto:tu-email@ejemplo.com

# Tus variables de Supabase existentes
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

### 3. Ejecutar Migración SQL

1. Ve a tu dashboard de Supabase
2. Abre SQL Editor
3. Copia y pega el contenido de `supabase/migrations/create_push_subscriptions_table.sql`
4. Ejecuta la migración

### 4. Reiniciar el Servidor de Desarrollo

```bash
npm run dev
```

**Importante**: Reinicia después de agregar las variables de entorno.

### 5. Probar Suscripción

1. **Abre la app** (usando HTTPS si usas ngrok, o localhost si usas Chrome)
2. **Ve a Settings/Profile** donde está el componente de notificaciones
3. **Haz clic en "Enable Notifications"**
4. **Concede permiso** cuando el navegador lo solicite
5. **Verifica en la consola del navegador** que no haya errores
6. **Verifica en Supabase** que la suscripción se guardó:
   ```sql
   SELECT * FROM push_subscriptions;
   ```

### 6. Probar Notificación de Prueba

1. En la página de configuración de notificaciones
2. Haz clic en **"Test Notification"**
3. Deberías ver una notificación inmediatamente

### 7. Probar Push Notification Manual

Puedes probar enviar una push notification manualmente usando la API:

**Opción A: Desde el navegador (DevTools Console)**

```javascript
// Obtén tu user ID de Supabase o de la app
const userId = 'tu-user-id'

fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: userId,
    title: 'Test Push',
    body: 'This is a test push notification!',
    icon: '/icons/icon-192x192.png',
    tag: 'test',
  })
})
.then(r => r.json())
.then(console.log)
```

**Opción B: Usando curl (desde terminal)**

```bash
# Primero necesitas obtener un token de sesión
# O puedes hacerlo desde la app misma

curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: tu-cookie-de-sesion" \
  -d '{
    "userId": "tu-user-id",
    "title": "Test Push",
    "body": "This is a test!",
    "icon": "/icons/icon-192x192.png"
  }'
```

### 8. Probar Schedule Endpoint (Cron)

El endpoint `/api/push/schedule` normalmente solo funciona a las 8 AM, pero puedes probarlo manualmente:

**Opción A: Con parámetro test**

```bash
# Desde el navegador (DevTools Console)
fetch('/api/push/schedule?test=true', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

**Opción B: Modificar temporalmente el código**

Puedes comentar temporalmente la verificación de hora en `src/app/api/push/schedule/route.ts`:

```typescript
// Comentar estas líneas temporalmente:
// if (!isManualTest && currentHour !== 8) {
//   return NextResponse.json(...)
// }
```

### 9. Crear Rutina de Prueba

1. **Crea una rutina** con días programados (ej: Lunes, Miércoles)
2. **Activa la rutina**
3. **Habilita notificaciones** si no lo has hecho
4. **Prueba el schedule endpoint** con `?test=true`
5. **Deberías recibir una notificación** si hoy es uno de los días programados

## 🔍 Verificar que Todo Funciona

### Checklist:

- [ ] VAPID keys generadas y en `.env.local`
- [ ] Variables de entorno configuradas
- [ ] Migración SQL ejecutada
- [ ] Servidor reiniciado
- [ ] Permisos de notificación concedidos
- [ ] Suscripción guardada en base de datos
- [ ] Notificación de prueba funciona
- [ ] Push notification manual funciona
- [ ] Schedule endpoint responde (con `?test=true`)

## 🐛 Troubleshooting Local

### "Service Worker registration failed"

- **Causa**: HTTPS no configurado o localhost sin permisos
- **Solución**: Usa ngrok o Chrome en localhost

### "VAPID keys not configured"

- **Causa**: Variables de entorno no cargadas
- **Solución**: Reinicia el servidor después de agregar las variables

### "Failed to subscribe"

- **Causa**: Permisos no concedidos o Service Worker no registrado
- **Solución**: 
  - Verifica permisos en configuración del navegador
  - Revisa la consola para errores
  - Asegúrate de usar HTTPS

### "No push subscriptions found"

- **Causa**: Suscripción no guardada o usuario incorrecto
- **Solución**: 
  - Verifica que la suscripción se guardó en la BD
  - Verifica que estás usando el user_id correcto

### Notificaciones no aparecen

- **Causa**: Service Worker no registrado o notificaciones bloqueadas
- **Solución**:
  - Verifica en DevTools → Application → Service Workers
  - Verifica permisos en configuración del navegador
  - Revisa la consola para errores

## 🧪 Script de Prueba Rápida

Crea un archivo `test-push.js` en la raíz:

```javascript
// test-push.js
// Ejecutar: node test-push.js

const testPush = async () => {
  const userId = 'TU_USER_ID_AQUI' // Reemplaza con tu user ID
  
  const response = await fetch('http://localhost:3000/api/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
      title: 'Test Push Notification',
      body: 'This is a test from the command line!',
      icon: '/icons/icon-192x192.png',
      tag: 'test',
    }),
  })
  
  const result = await response.json()
  console.log('Result:', result)
}

testPush()
```

**Nota**: Este script necesita autenticación, así que es mejor probarlo desde la app misma.

## 📝 Notas Importantes

1. **HTTPS es obligatorio** para push notifications en producción
2. **localhost funciona en Chrome** sin HTTPS
3. **ngrok es la mejor opción** para probar localmente con HTTPS
4. **El schedule endpoint** solo envía a las 8 AM por defecto (usa `?test=true` para probar)
5. **Las suscripciones** se guardan por usuario y endpoint (un usuario puede tener múltiples dispositivos)

## 🚀 Flujo de Prueba Completo

1. Inicia ngrok: `ngrok http 3000`
2. Inicia app: `npm run dev`
3. Abre la URL de ngrok en el navegador
4. Habilita notificaciones en la app
5. Crea una rutina con días programados
6. Prueba manualmente: `fetch('/api/push/schedule?test=true', { method: 'POST' })`
7. Verifica que recibiste la notificación

¡Listo para probar! 🎉

