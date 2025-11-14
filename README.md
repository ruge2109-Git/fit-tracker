# FitTrackr 💪

Aplicación completa de tracking de entrenamientos construida con Next.js 14, TypeScript, Supabase y Tailwind CSS. Sigue principios SOLID y Clean Architecture.

## ✨ Características Principales

- 🔐 **Autenticación** - Segura con Supabase Auth (email/password + OAuth)
- 📊 **Dashboard** - Estadísticas y gráficas de progreso
- 🏋️ **Workouts** - Crear, editar, ver y eliminar entrenamientos
- 💪 **Ejercicios** - Catálogo completo con filtros por tipo y grupo muscular
- 📝 **Rutinas** - Plantillas reutilizables con frecuencia y días programados
- 📈 **Progreso** - Visualización con gráficas interactivas
- 📱 **PWA** - Instalable como app nativa, funciona offline
- 🔔 **Notificaciones Push** - Recordatorios para rutinas programadas
- 🎬 **Multimedia** - Soporte para imágenes, videos y GIFs de ejercicios
- 🌓 **Dark Mode** - Tema claro/oscuro con detección del sistema
- 🌍 **i18n** - Soporte multi-idioma (Español/Inglés)
- ⏱️ **Rest Timer** - Temporizador de descanso integrado con notificaciones
- 🧮 **1RM Calculator** - Calculadora de repetición máxima
- 🎯 **Drag & Drop** - Reordenar ejercicios en rutinas

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear .env.local con:
# NEXT_PUBLIC_SUPABASE_URL=tu-url-supabase
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key-supabase
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# Ejecutar migraciones de base de datos
# Ver docs/INSTALLATION.md para detalles

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
npm start
```

## 📚 Documentación

Toda la documentación está disponible en la carpeta [`/docs`](./docs/):

- **[Índice de Documentación](./docs/README.md)** - Guía completa del proyecto
- **[Instalación](./docs/INSTALLATION.md)** - Guía de instalación detallada paso a paso
- **[Despliegue](./docs/DEPLOYMENT.md)** - Instrucciones de despliegue a producción
- **[Arquitectura](./docs/ARCHITECTURE.md)** - Arquitectura y patrones de diseño
- **[Desarrollo](./docs/DEVELOPMENT.md)** - Guía de desarrollo y buenas prácticas
- **[PWA](./docs/PWA.md)** - Configuración y características de Progressive Web App
- **[Notificaciones Push](./docs/PUSH_NOTIFICATIONS.md)** - Configuración y uso de notificaciones push

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
npm run type-check   # Verificación de tipos TypeScript
npm run pre-commit   # Ejecutar checks pre-commit
npm run generate-vapid-keys  # Generar claves VAPID para push notifications
```

## 🏗️ Arquitectura

El proyecto sigue principios **SOLID** y **Clean Architecture**:

- **Domain Layer** - Lógica de negocio y repositorios
- **Application Layer** - Servicios y casos de uso
- **Infrastructure Layer** - Supabase, IndexedDB, Logger
- **Presentation Layer** - React components y páginas

### Patrones Implementados

- ✅ **Repository Pattern** - Abstracción de acceso a datos
- ✅ **Service Layer** - Lógica de negocio separada
- ✅ **Observer Pattern** - State management con Zustand
- ✅ **Factory Pattern** - Creación de clientes Supabase

Ver [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para más detalles.

## 📦 Stack Tecnológico

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- React Hook Form + Zod
- Recharts
- Framer Motion
- next-intl
- next-pwa

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Row-Level Security (RLS)

**Herramientas:**
- ESLint
- TypeScript strict mode
- Pre-commit hooks

## 🗄️ Base de Datos

El proyecto requiere **4 migraciones** en orden:

1. `001_initial_schema.sql` - Esquema inicial (tablas, RLS, seed data)
2. `002_add_routine_scheduling.sql` - Frecuencia y días programados
3. `003_add_multimedia.sql` - Soporte multimedia para ejercicios
4. `004_add_completed_to_sets.sql` - Columna completed para sets
5. `create_push_subscriptions_table.sql` - Tabla para suscripciones push

Ver [`docs/INSTALLATION.md`](./docs/INSTALLATION.md) para instrucciones detalladas.

## 🚢 Despliegue

Despliegue recomendado:
- **Frontend**: Vercel (gratis)
- **Backend**: Supabase Cloud (gratis)
- **Cron Jobs**: Vercel Cron Jobs o GitHub Actions

Ver [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) para guía completa.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Ejecuta `npm run pre-commit` antes de commitear
4. Commit tus cambios (`git commit -m 'Add amazing feature'`)
5. Push a la rama (`git push origin feature/amazing-feature`)
6. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.

---

**Built with ❤️ and TypeScript**

Happy training! 💪🏋️‍♂️
