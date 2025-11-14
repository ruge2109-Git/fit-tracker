# 📚 Documentación de FitTrackr

Bienvenido a la documentación completa de FitTrackr. Esta guía te ayudará a entender, instalar, desarrollar y desplegar la aplicación.

## 📖 Índice de Documentación

### 🚀 Guías de Inicio

- **[Instalación](./INSTALLATION.md)** - Guía paso a paso para instalar y configurar FitTrackr en tu máquina local
- **[Despliegue](./DEPLOYMENT.md)** - Instrucciones completas para desplegar la aplicación a producción

### 🏗️ Arquitectura y Desarrollo

- **[Arquitectura](./ARCHITECTURE.md)** - Explicación detallada de la arquitectura, patrones de diseño y principios SOLID
- **[Desarrollo](./DEVELOPMENT.md)** - Guía de desarrollo, buenas prácticas, scripts pre-commit y herramientas

### 📱 Características Avanzadas

- **[PWA](./PWA.md)** - Configuración y características de Progressive Web App, íconos y funcionalidad offline
- **[Notificaciones Push](./PUSH_NOTIFICATIONS.md)** - Configuración completa de notificaciones push, VAPID keys, cron jobs y testing

## 🎯 Guía Rápida por Rol

### Para Desarrolladores Nuevos

1. Lee [Instalación](./INSTALLATION.md) para configurar tu entorno
2. Revisa [Arquitectura](./ARCHITECTURE.md) para entender la estructura del proyecto
3. Consulta [Desarrollo](./DEVELOPMENT.md) para conocer las herramientas y prácticas

### Para DevOps

1. Revisa [Despliegue](./DEPLOYMENT.md) para configurar producción
2. Consulta [Notificaciones Push](./PUSH_NOTIFICATIONS.md) para configurar cron jobs
3. Verifica [PWA](./PWA.md) para configuración de íconos y manifest

### Para Contribuidores

1. Lee [Desarrollo](./DEVELOPMENT.md) para conocer el flujo de trabajo
2. Revisa [Arquitectura](./ARCHITECTURE.md) para entender los patrones
3. Consulta las guías específicas según la feature que vayas a desarrollar

## 📋 Estructura del Proyecto

```
fittrackr/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Rutas con internacionalización
│   │   │   ├── (dashboard)/   # Rutas protegidas del dashboard
│   │   │   └── auth/          # Páginas de autenticación
│   │   └── api/               # API Routes
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base (shadcn/ui)
│   │   ├── workouts/         # Componentes de workouts
│   │   ├── exercises/        # Componentes de ejercicios
│   │   └── charts/           # Componentes de gráficas
│   ├── domain/                # Capa de dominio
│   │   ├── repositories/     # Repositorios (acceso a datos)
│   │   └── services/        # Servicios (lógica de negocio)
│   ├── store/                 # Zustand stores
│   ├── lib/                   # Utilidades y helpers
│   └── types/                 # Definiciones TypeScript
├── supabase/
│   ├── migrations/           # Migraciones de base de datos
│   └── functions/            # Edge Functions (opcional)
├── public/                    # Archivos estáticos
│   ├── icons/                # Íconos PWA
│   └── sw-push.js           # Service Worker para push
└── docs/                      # Documentación
```

## 🔑 Conceptos Clave

### Clean Architecture

El proyecto sigue Clean Architecture con separación de capas:
- **Presentation Layer**: Componentes React y páginas
- **Application Layer**: Servicios y stores
- **Domain Layer**: Repositorios e interfaces
- **Infrastructure Layer**: Supabase, IndexedDB

### Repository Pattern

Todos los accesos a datos se abstraen a través de repositorios, facilitando:
- Testing (mock repositories)
- Cambio de fuente de datos
- Consistencia en el manejo de errores

### Type Safety

TypeScript en modo estricto garantiza:
- Type safety end-to-end
- Mejor autocompletado
- Detección temprana de errores

## 🛠️ Tecnologías Principales

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Type safety
- **Supabase** - Backend as a Service (PostgreSQL + Auth)
- **Tailwind CSS** - Estilos utility-first
- **Zustand** - State management ligero
- **React Hook Form + Zod** - Formularios y validación
- **next-pwa** - Soporte PWA
- **web-push** - Notificaciones push

## 📝 Convenciones

### Nomenclatura

- **Componentes**: PascalCase (`WorkoutCard.tsx`)
- **Archivos de utilidades**: camelCase (`push.service.ts`)
- **Tipos/Interfaces**: PascalCase (`Workout`, `Exercise`)
- **Constantes**: UPPER_SNAKE_CASE (`VAPID_PUBLIC_KEY`)

### Estructura de Commits

```
feat: nueva característica
fix: corrección de bug
docs: cambios en documentación
style: formato, punto y coma faltante, etc.
refactor: refactorización de código
test: agregar o modificar tests
chore: cambios en build, dependencias, etc.
```

## 🐛 Solución de Problemas

### Problemas Comunes

Consulta las secciones de troubleshooting en cada guía:
- [Instalación - Troubleshooting](./INSTALLATION.md#troubleshooting)
- [Despliegue - Troubleshooting](./DEPLOYMENT.md#troubleshooting-deployment)
- [Notificaciones Push - Troubleshooting](./PUSH_NOTIFICATIONS.md#troubleshooting)

## 📞 Soporte

- 🐛 [Abrir un issue](https://github.com/ruge2109-Git/fit-tracker/issues)
- 📖 Revisar la documentación específica
- 💬 [Supabase Discord](https://discord.supabase.com)
- 💬 [Next.js Discussions](https://github.com/vercel/next.js/discussions)

## 🔄 Actualizaciones

Esta documentación se actualiza regularmente. Si encuentras información desactualizada o errores, por favor:
1. Abre un issue
2. O crea un Pull Request con las correcciones

---

**Última actualización**: 14/11/2025
