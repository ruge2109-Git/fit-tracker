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
- 🔔 **Notificaciones** - Recordatorios para rutinas programadas
- 🎬 **Multimedia** - Soporte para imágenes, videos y GIFs de ejercicios
- 🌓 **Dark Mode** - Tema claro/oscuro con detección del sistema
- 🌍 **i18n** - Soporte multi-idioma (Español/Inglés)
- ⏱️ **Rest Timer** - Temporizador de descanso integrado
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

- **[README Principal](./docs/README.md)** - Documentación completa del proyecto
- **[Instalación](./docs/INSTALLATION.md)** - Guía de instalación detallada paso a paso
- **[Despliegue](./docs/DEPLOYMENT.md)** - Instrucciones de despliegue a producción
- **[Arquitectura](./docs/ARCHITECTURE.md)** - Arquitectura y patrones de diseño
- **[Pre-commit](./docs/PRE_COMMIT.md)** - Scripts de pre-commit y calidad de código

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
npm run type-check   # Verificación de tipos TypeScript
npm run pre-commit   # Ejecutar checks pre-commit
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

## 📝 Pre-commit

Antes de cada commit, ejecuta:

```bash
npm run pre-commit
```

Esto ejecuta:
- ✅ Type checking (TypeScript)
- Linting (ESLint)
- ⚠️ Detección de console.log (debería usarse logger)
- ⚠️ Lista de TODOs/FIXMEs

Ver [`docs/PRE_COMMIT.md`](./docs/PRE_COMMIT.md) para configuración de git hooks.

## 🗄️ Base de Datos

El proyecto requiere **3 migraciones** en orden:

1. `001_initial_schema.sql` - Esquema inicial (tablas, RLS, seed data)
2. `002_add_routine_scheduling.sql` - Frecuencia y días programados
3. `003_add_multimedia.sql` - Soporte multimedia para ejercicios

Ver [`docs/INSTALLATION.md`](./docs/INSTALLATION.md) para instrucciones detalladas.

## 🚢 Despliegue

Despliegue recomendado:
- **Frontend**: Vercel (gratis)
- **Backend**: Supabase Cloud (gratis)

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

