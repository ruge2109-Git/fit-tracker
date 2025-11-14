# 🚀 Guía de Instalación - FitTrackr

Guía completa paso a paso para instalar y configurar FitTrackr en tu máquina local.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- ✅ Node.js 18 o superior
- ✅ npm 9 o superior (o yarn)
- ✅ Cuenta de Supabase (gratis)
- ✅ Git instalado
- ✅ Navegador moderno (Chrome, Firefox, Safari, Edge)

## Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/ruge2109-Git/fit-tracker.git
cd fit-tracker
```

## Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias, incluyendo:
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Supabase client
- Zustand
- Y todas las demás dependencias

## Paso 3: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en **"New Project"**
3. Completa los detalles:
   - **Name**: FitTrackr (o el nombre que prefieras)
   - **Database Password**: Elige una contraseña segura (guárdala)
   - **Region**: Selecciona la más cercana a tu ubicación
4. Haz clic en **"Create new project"**
5. Espera 2-3 minutos mientras se provisiona la base de datos

## Paso 4: Obtener Credenciales de Supabase

Una vez que tu proyecto esté listo:

1. Ve a **Project Settings** (ícono de engranaje en la barra lateral)
2. Haz clic en **API** en el menú de configuración
3. Verás dos valores importantes:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: Una cadena larga que comienza con `eyJhbGc...`
4. Mantén esta pestaña abierta, necesitarás estos valores

**Nota**: También necesitarás el `service_role` key más adelante para push notifications, pero por ahora el `anon` key es suficiente.

## Paso 5: Configurar Variables de Entorno

1. En la raíz del proyecto, crea un archivo `.env.local`:

```bash
# Windows
type nul > .env.local

# Linux/Mac
touch .env.local
```

2. Abre `.env.local` en tu editor de texto

3. Agrega tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Importante:**
- Reemplaza `tu-proyecto-id` con tu ID real de proyecto Supabase
- Reemplaza `tu-anon-key-aqui` con tu anon key real
- No agregues comillas alrededor de los valores
- No dejes espacios alrededor del signo `=`

## Paso 6: Ejecutar Migraciones de Base de Datos

Necesitas ejecutar **5 migraciones** en orden. Todas se ejecutan desde el SQL Editor de Supabase.

### Migración 1: Esquema Inicial

1. En tu proyecto de Supabase, ve a **SQL Editor** (ícono en la barra lateral izquierda)
2. Haz clic en **"New query"**
3. Abre el archivo `supabase/migrations/001_initial_schema.sql` de tu proyecto
4. Copia todo el contenido
5. Pégalo en el SQL Editor
6. Haz clic en **"Run"** (o presiona `Ctrl/Cmd + Enter`)
7. Deberías ver "Success. No rows returned"

Esto crea:
- Tabla `workouts`
- Tabla `exercises` (con 10 ejercicios por defecto)
- Tabla `sets`
- Tabla `routines`
- Tabla `routine_exercises`
- Row-Level Security (RLS) policies
- Índices para optimización

### Migración 2: Programación de Rutinas

1. Haz clic en **"New query"** nuevamente
2. Abre `supabase/migrations/002_add_routine_scheduling.sql`
3. Copia y pega el contenido
4. Haz clic en **"Run"**

Esto agrega:
- Columna `frequency` a la tabla `routines`
- Columna `scheduled_days` a la tabla `routines`
- Columna `routine_id` a la tabla `workouts`

### Migración 3: Soporte Multimedia

1. Haz clic en **"New query"** nuevamente
2. Abre `supabase/migrations/003_add_multimedia.sql`
3. Copia y pega el contenido
4. Haz clic en **"Run"**

Esto agrega:
- Columna `image_url` a la tabla `exercises`
- Columna `video_url` a la tabla `exercises`
- Columna `demonstration_gif` a la tabla `exercises`

### Migración 4: Columna Completed en Sets

1. Haz clic en **"New query"** nuevamente
2. Abre `supabase/migrations/004_add_completed_to_sets.sql`
3. Copia y pega el contenido
4. Haz clic en **"Run"**

Esto agrega:
- Columna `completed` (BOOLEAN) a la tabla `sets`

### Migración 5: Push Subscriptions (Opcional)

Solo necesaria si vas a usar notificaciones push:

1. Haz clic en **"New query"** nuevamente
2. Abre `supabase/migrations/create_push_subscriptions_table.sql`
3. Copia y pega el contenido
4. Haz clic en **"Run"**

Esto crea:
- Tabla `push_subscriptions` con RLS habilitado

**Nota**: Puedes hacer esta migración más adelante si no vas a usar push notifications inmediatamente.

## Paso 7: Verificar la Configuración de la Base de Datos

En Supabase Dashboard:

1. Ve a **Table Editor**
2. Deberías ver estas tablas:
   - ✅ `workouts`
   - ✅ `exercises` (con 10 ejercicios por defecto)
   - ✅ `sets`
   - ✅ `routines`
   - ✅ `routine_exercises`
   - ✅ `push_subscriptions` (si ejecutaste la migración 5)

3. Verifica columnas:
   - `routines` debe tener `frequency` y `scheduled_days`
   - `exercises` debe tener `image_url`, `video_url`, `demonstration_gif`
   - `workouts` debe tener `routine_id`
   - `sets` debe tener `completed`

## Paso 8: Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

Deberías ver:

```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in Xms
```

## Paso 9: Abrir la Aplicación

1. Abre tu navegador
2. Navega a [http://localhost:3000](http://localhost:3000)
3. Deberías ver la página de inicio/login de FitTrackr

## Paso 10: Crear tu Cuenta

1. Haz clic en la pestaña **"Sign Up"**
2. Completa el formulario:
   - **Name**: Tu nombre
   - **Email**: Tu email
   - **Password**: Al menos 6 caracteres
3. Haz clic en **"Sign Up"**
4. Serás redirigido automáticamente al dashboard después del registro

🎉 **¡Felicitaciones!** FitTrackr está ahora funcionando en tu máquina.

## Próximos Pasos

### Probar las Características

1. ✅ Crear tu primer workout
2. ✅ Agregar ejercicios desde el catálogo
3. ✅ Ver estadísticas en el dashboard
4. ✅ Probar el modo oscuro
5. ✅ Explorar la biblioteca de ejercicios
6. ✅ Crear una rutina con días programados
7. ✅ Iniciar un workout desde una rutina
8. ✅ Usar el temporizador de descanso durante workouts
9. ✅ Probar la calculadora 1RM
10. ✅ Revisar tu página de perfil

### Configurar OAuth (Opcional)

Para habilitar Google Sign-In:

1. En Supabase Dashboard, ve a **Authentication** → **Providers**
2. Encuentra **Google** y haz clic en **Enable**
3. Sigue las instrucciones para configurar Google OAuth
4. Agrega tu Google Client ID y Secret
5. Guarda la configuración

### Configurar Push Notifications (Opcional)

Si quieres usar notificaciones push:

1. Sigue la guía completa en [docs/PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md)
2. Genera VAPID keys: `npm run generate-vapid-keys`
3. Agrega las variables de entorno necesarias
4. Ejecuta la migración de push subscriptions (si no lo hiciste antes)

## Troubleshooting

### Error: "Module not found"

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: Variables de entorno no funcionan

- Reinicia el servidor de desarrollo después de cambiar `.env.local`
- Asegúrate de que las variables empiecen con `NEXT_PUBLIC_` si se usan en el cliente
- Verifica que no haya espacios extra o comillas alrededor de los valores

### Error: Conexión a base de datos falla

- ✅ Verifica que las credenciales en `.env.local` sean correctas
- ✅ Verifica que tu proyecto de Supabase esté activo
- ✅ Asegúrate de que ejecutaste las migraciones SQL

### Error: Build falla con errores de TypeScript

```bash
# Limpiar caché de Next.js
rm -rf .next
npm run build
```

### Error: Autenticación no funciona

- ✅ Limpia cookies y caché del navegador
- ✅ Verifica que Supabase Auth esté habilitado en el dashboard
- ✅ Verifica que las URLs de redirección estén configuradas

### Error: Ejercicios no aparecen

La migración inicial debería haber creado 10 ejercicios por defecto. Verifica:

```sql
-- En Supabase SQL Editor
SELECT COUNT(*) FROM exercises;
```

Si no hay ejercicios, puedes ejecutar nuevamente la parte de seed data de `001_initial_schema.sql`.

### Error: Puerto 3000 ya en uso

```bash
# Usar un puerto diferente
npm run dev -- -p 3001
```

Luego accede a `http://localhost:3001`

## Consejos de Desarrollo

### Hot Reload

Next.js soporta hot module replacement. Los cambios en los archivos se reflejarán automáticamente en el navegador.

### Errores de TypeScript

Si ves errores de TypeScript en tu editor:

1. Reinicia el servidor TypeScript en VS Code:
   - `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

### Cambios en la Base de Datos

Si modificas el esquema de la base de datos:

1. Haz los cambios en Supabase SQL Editor
2. Actualiza los tipos TypeScript en `src/types/index.ts`
3. Actualiza los repositorios si es necesario

### Variables de Entorno

- Las variables que empiezan con `NEXT_PUBLIC_` están disponibles en el cliente
- Las variables sin ese prefijo solo están disponibles en el servidor
- Reinicia el servidor después de cambiar variables de entorno

## Obtener Ayuda

- 📖 Revisa la [documentación principal](./README.md)
- 🐛 [Abrir un issue](https://github.com/ruge2109-Git/fit-tracker/issues) en GitHub
- 💬 [Supabase Discord](https://discord.supabase.com)
- 💬 [Next.js Discussions](https://github.com/vercel/next.js/discussions)

## Despliegue a Producción

Cuando estés listo para desplegar:

1. Revisa la guía completa en [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
2. Configura variables de entorno en tu plataforma de hosting
3. Ejecuta las migraciones en tu base de datos de producción

---

**Happy Coding! 💪**
