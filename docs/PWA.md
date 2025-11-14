# 📱 Progressive Web App (PWA) - FitTrackr

Guía completa sobre la configuración y características PWA de FitTrackr.

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Características PWA](#características-pwa)
3. [Configuración](#configuración)
4. [Generar Íconos](#generar-íconos)
5. [Service Worker](#service-worker)
6. [Funcionalidad Offline](#funcionalidad-offline)
7. [Instalación](#instalación)
8. [Troubleshooting](#troubleshooting)

## Introducción

FitTrackr es una Progressive Web App (PWA) completa que puede ser instalada como una aplicación nativa en cualquier dispositivo. Esto proporciona:

- ✅ Instalación como app nativa
- ✅ Funcionalidad offline completa
- ✅ Sincronización automática cuando vuelve la conexión
- ✅ Notificaciones push
- ✅ Acceso rápido desde la pantalla de inicio

## Características PWA

### Instalable

Los usuarios pueden instalar FitTrackr en sus dispositivos:

- **Desktop**: Desde el navegador (Chrome, Edge, Firefox)
- **Android**: Desde Chrome o cualquier navegador compatible
- **iOS**: Desde Safari (iOS 11.3+)

### Offline

La app funciona completamente sin conexión a internet:

- ✅ Ver workouts existentes
- ✅ Crear nuevos workouts
- ✅ Ver ejercicios y rutinas
- ✅ Usar el temporizador de descanso
- ✅ Ver estadísticas y gráficas
- ✅ Sincronización automática cuando vuelve la conexión

### Service Worker

Un Service Worker maneja:

- Caché de recursos estáticos
- Funcionalidad offline
- Notificaciones push
- Actualizaciones en segundo plano

## Configuración

### Manifest

El archivo `public/manifest.json` define la configuración de la PWA:

```json
{
  "name": "FitTrackr",
  "short_name": "FitTrackr",
  "description": "Aplicación de tracking de entrenamientos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    // ... más íconos
  ]
}
```

### next-pwa

La configuración de PWA se maneja a través de `next-pwa` en `next.config.js`:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})
```

**Nota**: PWA está deshabilitada en desarrollo por defecto para facilitar el desarrollo.

## Generar Íconos

Para que la PWA funcione correctamente, necesitas generar íconos PNG en diferentes tamaños.

### Tamaños Requeridos

- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-152x152.png` - 152x152px
- `icon-192x192.png` - 192x192px
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px
- `apple-touch-icon.png` - 180x180px (para iOS)

### Métodos para Generar Íconos

#### Opción 1: RealFaviconGenerator (Recomendado)

1. Ve a [https://realfavicongenerator.net/](https://realfavicongenerator.net/)
2. Sube tu ícono SVG o imagen base
3. Configura los tamaños y opciones
4. Descarga el paquete generado
5. Copia los archivos PNG a `public/icons/`

#### Opción 2: Usando Sharp (Node.js)

Ya existe un script en `scripts/generate-icons-sharp.js`:

```bash
node scripts/generate-icons-sharp.js
```

**Requisitos:**
- Tener un archivo SVG base en `public/icons/icon-192x192.svg`
- Tener `sharp` instalado: `npm install sharp --save-dev`

#### Opción 3: Manualmente

1. Abre tu ícono SVG en Figma, Adobe Illustrator, o similar
2. Exporta cada tamaño como PNG
3. Guarda en `public/icons/` con los nombres correctos

### Verificación

Después de generar los íconos, verifica que todos existan:

```bash
# Windows PowerShell
Get-ChildItem public/icons/*.png | Select-Object Name

# Mac/Linux
ls public/icons/*.png
```

Debes ver todos los archivos listados anteriormente.

### Notas sobre Íconos

- Los íconos deben ser cuadrados (1:1 aspect ratio)
- Usa colores sólidos y diseños simples para mejor visibilidad
- El ícono de 512x512px es especialmente importante para Android
- El `apple-touch-icon.png` debe ser exactamente 180x180px para iOS

## Service Worker

### sw-push.js

El Service Worker principal está en `public/sw-push.js` y maneja:

1. **Notificaciones Push:**
   - Recibe notificaciones del servidor
   - Muestra notificaciones al usuario
   - Maneja clicks en notificaciones

2. **Temporizador de Descanso:**
   - Actualiza notificaciones persistentes con tiempo restante
   - Actualiza el badge de la app
   - Muestra notificación cuando el temporizador llega a cero

3. **Instalación:**
   - Se activa automáticamente cuando la app se carga
   - Se registra en segundo plano

### Registro del Service Worker

El Service Worker se registra automáticamente a través de `next-pwa`. No necesitas hacer nada manualmente.

### Actualización del Service Worker

Cuando hay una nueva versión:

1. El nuevo Service Worker se instala en segundo plano
2. Se activa cuando todas las pestañas de la app se cierran
3. La próxima vez que se abra la app, usará la nueva versión

## Funcionalidad Offline

### IndexedDB

FitTrackr usa IndexedDB para almacenar datos offline:

- **Workouts**: Se guardan localmente cuando se crean offline
- **Exercises**: Se cachean para acceso offline
- **Routines**: Disponibles offline
- **Sets**: Se guardan con sus workouts

### Sincronización Automática

Cuando la app vuelve a tener conexión:

1. Detecta automáticamente que hay conexión
2. Sincroniza datos pendientes con Supabase
3. Muestra un indicador de sincronización
4. Notifica al usuario cuando la sincronización completa

### Estrategia de Caché

- **Static Assets**: Se cachean permanentemente
- **API Responses**: Se cachean temporalmente
- **Images**: Se cachean con estrategia de red primero

## Instalación

### Desktop (Chrome/Edge)

1. Abre FitTrackr en el navegador
2. Busca el ícono de instalación en la barra de direcciones
3. Haz clic en "Instalar" o "Add to Home Screen"
4. La app se instalará como una aplicación nativa

### Android (Chrome)

1. Abre FitTrackr en Chrome
2. Aparecerá un banner de instalación
3. O ve a Menú → "Add to Home Screen"
4. La app se instalará en la pantalla de inicio

### iOS (Safari)

1. Abre FitTrackr en Safari
2. Toca el botón de compartir
3. Selecciona "Add to Home Screen"
4. La app se instalará en la pantalla de inicio

**Nota**: En iOS, la PWA se comporta como una app nativa pero con algunas limitaciones comparado con Android.

## Troubleshooting

### La app no se puede instalar

1. **Verifica HTTPS:**
   - Las PWAs requieren HTTPS (excepto localhost)
   - Asegúrate de que tu dominio use HTTPS

2. **Verifica el manifest:**
   - Abre DevTools → Application → Manifest
   - Verifica que no haya errores

3. **Verifica íconos:**
   - Asegúrate de que todos los íconos existan
   - Verifica que los tamaños sean correctos

### Funcionalidad offline no funciona

1. **Verifica Service Worker:**
   - DevTools → Application → Service Workers
   - Verifica que esté registrado y activo

2. **Verifica IndexedDB:**
   - DevTools → Application → IndexedDB
   - Verifica que haya datos almacenados

3. **Limpia caché:**
   - DevTools → Application → Clear storage
   - Recarga la página

### Notificaciones no funcionan

Consulta la guía completa en [docs/PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md).

### La app no se actualiza

1. **Fuerza actualización:**
   - Cierra todas las pestañas de la app
   - Abre DevTools → Application → Service Workers
   - Haz clic en "Unregister"
   - Recarga la página

2. **Limpia caché:**
   - DevTools → Application → Clear storage
   - Recarga la página

## Mejores Prácticas

### Performance

- ✅ Optimiza imágenes antes de agregarlas
- ✅ Usa lazy loading para componentes pesados
- ✅ Minimiza el tamaño del Service Worker
- ✅ Cachea recursos estáticos agresivamente

### UX

- ✅ Muestra indicadores de carga claros
- ✅ Notifica al usuario sobre sincronización
- ✅ Maneja errores de conexión gracefully
- ✅ Proporciona feedback cuando se guarda offline

### Testing

- ✅ Prueba en diferentes navegadores
- ✅ Prueba en diferentes dispositivos
- ✅ Prueba funcionalidad offline
- ✅ Prueba instalación en diferentes plataformas

## Recursos Adicionales

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Última actualización**: 14/11/2025

