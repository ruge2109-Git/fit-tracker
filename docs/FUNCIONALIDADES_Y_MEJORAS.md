# FitTrackr — Inventario de funcionalidades y posibles mejoras

Este documento describe el propósito de la aplicación (**FitTrackr**), el inventario de capacidades actuales según el código y la base de datos, y una lista orientativa de mejoras posibles. Sirve como mapa rápido para producto, desarrollo y documentación.

---

## 1. Propósito y usos principales

**FitTrackr** es una aplicación web de seguimiento de entrenamiento (PWA) orientada a:

- Registrar **sesiones de entreno** con ejercicios, series, repeticiones, peso, descansos y notas.
- Gestionar un **catálogo de ejercicios** y **rutinas** reutilizables con programación por frecuencia y días.
- Visualizar **progreso** (volumen, distribución muscular, récords personales, consistencia, comparativas de periodos).
- Apoyar la **motivación** (rachas, insignias, leaderboard social, feed de actividad).
- Ofrecer **herramientas** (temporizador de descanso, calculadora 1RM) y **asistencia por IA** (coach, análisis semanal, detección de estancamiento, análisis de rutina).
- Operar como **PWA** instalable, con **i18n** (p. ej. español/inglés), **tema claro/oscuro** y **notificaciones push** para recordatorios ligados a rutinas.

**Stack resumido:** Next.js 14 (App Router), TypeScript, Supabase (Auth, PostgreSQL, Storage, RLS), Tailwind, Zustand, React Query, next-intl, next-pwa, web-push (VAPID), OpenAI para rutas de IA.

---

## 2. Funcionalidades implementadas (inventario)

### 2.1 Autenticación y sesión

- Registro / inicio de sesión con **Supabase Auth** (email/contraseña según flujo de la app).
- **Recuperación de contraseña** (`/auth/forgot-password`, `/auth/reset-password`).
- **Middleware** con detección de locale, cookies de idioma y **protección de rutas** del dashboard.
- **Cierre de sesión** desde perfil.

### 2.2 Internacionalización y experiencia global

- Rutas bajo `[locale]` con **next-intl**.
- Selector de idioma en la barra de navegación.
- Textos de interfaz externalizados en mensajes (no hardcodeados en un solo idioma en todas las pantallas).

### 2.3 Dashboard

- Resumen de **estadísticas** del usuario (sesiones, duración, volumen, etc., vía `statsService`).
- **Gráficas:** volumen por semana, distribución por grupo muscular, ejercicios más frecuentes.
- **Récords personales** y lista visual.
- **Mapa de calor / consistencia** y **comparación de periodos**.
- **Calendario** de entrenos y **franja semanal** de rutinas programadas.
- **Inicio rápido** desde rutinas (`QuickStartRoutines`).
- **Contador de racha** (`StreakCounter`) con lógica de racha y **recuperación de racha** (API `/api/streak/recover`; ver migraciones de BD).
- **Banner de informe IA** semanal (`ai_reports` en Supabase, tipo `weekly_summary`).
- Modo de vista **compacta** (hook `useCompactMode`).
- Fechas contextualizadas (p. ej. utilidades de **zona horaria Colombia** en partes del producto).

### 2.4 Entrenamientos (workouts)

- Listado con **vista lista / calendario**, **ordenación** (fecha, duración) y **filtros** (búsqueda en notas, rango de fechas, duración mín/máx).
- **Filtros guardados** en base de datos (`saved_filters`) con favoritos; aplicación rápida desde la UI.
- Creación de entreno: **desde plantilla de rutina**, **flujo guiado** (`/workouts/new`) y **entreno libre** (`/workouts/new-free`).
- **Detalle, edición y eliminación** de sesiones.
- **Formulario de entreno** con ejercicios ordenables (drag & drop donde aplique), series, marcar completado, notas.
- **Temporizador de descanso** integrado en sesión (`workout-rest-timer`).
- **Banner de sesión activa** para continuidad entre pantallas.
- **Etiquetas (tags)** en entrenos (`WorkoutTags` / `useWorkoutTags`).
- **Tarjeta para compartir** sesión (`workout-share-card`; export visual).
- **Sugerencias de historial** por ejercicio en el flujo de entreno.
- **Diálogo de progreso** por ejercicio.

### 2.5 Ejercicios

- **Catálogo** con tipos (fuerza, cardio, movilidad, flexibilidad) y **grupos musculares**.
- **Creación y edición** de ejercicios personalizados.
- **Multimedia** en ejercicios (imágenes, vídeo, GIF) según esquema y políticas de storage.
- Página de **estadísticas por ejercicio** (`/exercises/[id]/stats`) con tendencias y alertas de **meseta** (`plateau-alert` + API `/api/ai/plateau-check`).

### 2.6 Rutinas

- CRUD de **rutinas** con ejercicios, orden, frecuencia, días de la semana, tiempos de descanso y reps máx. según migraciones.
- **Rutinas públicas** e **importación** de rutinas (`import-routine-dialog`, hooks asociados).
- Programación alineada con **notificaciones push** y cron (recordatorios).

### 2.7 Objetivos (goals)

- Listado, creación, detalle y edición de **metas** de entrenamiento (tablas y servicios `goal` / `goal-tracking`).

### 2.8 Mediciones corporales

- Registro y edición de **medidas** corporales a lo largo del tiempo (`body-measurement`).

### 2.9 Fotos de progreso

- Subida y gestión de **fotos de progreso** con políticas de Storage en Supabase.

### 2.10 Herramientas (`/tools`)

- **Temporizador de descanso** independiente.
- **Calculadora 1RM** (fórmulas de estimación de una repetición máxima).

### 2.11 Perfil y ajustes

- Vista de perfil con **estadísticas**, **1RM** destacados, **insignias de racha**.
- **Ajustes de app** (preferencias generales).
- **Días de descanso** configurables (afectan lógica de calendario/rachas según implementación).
- **Perfil social** (nickname/visibilidad según `social-profile-settings`).
- **Notificaciones:** componente de configuración push (`notification-settings`).
- **Gestión de datos:** exportación (JSON/CSV), respaldos, estadísticas de uso (`data-management`, `backup-manager`, `usage-stats`).
- **Tema** claro/oscuro (next-themes) en navegación móvil y desktop.

### 2.12 Social

- **Arena / leaderboard** semanal (`/api/social/leaderboard`, `statsService.getWeeklyLeaderboard`).
- **Feed de actividad** con **likes** y **comentarios** (rutas `/api/feed`, `/api/feed/[feedId]/like`, `/api/feed/[feedId]/comments`).
- **Amigos:** búsqueda, solicitudes y listado (`/api/friends`, `/api/friends/search`).
- **Chat global** y **mensajes directos** (`/api/chat/global`, `/api/chat/dm`) con contador de no leídos en navegación; **realtime** y recibos de lectura en migraciones.
- **Notificaciones** de eventos sociales (módulo `social-notifications`).

### 2.13 Inteligencia artificial

- **Coach por chat** (UI `ai-coach-chat`, store, API `/api/ai/coach`).
- **Análisis semanal** (`/api/ai/weekly-analysis`) y persistencia en `ai_reports`.
- **Comprobación de meseta** (`/api/ai/plateau-check`).
- **Análisis de rutina** (`/api/ai/analyze-routine`).

### 2.14 Feedback

- Envío de **feedback** de usuario (`/api/feedback`).
- Consulta de **mis tickets** (`/api/feedback/my`) y detalle (`/api/feedback/[id]`).
- **Panel admin** de feedback con políticas RLS dedicadas.

### 2.15 Administración

- **Panel admin** (`/admin`) con enlaces a submódulos.
- **Gestión de feedback** (`/admin/feedback`).
- **Auditoría** (`/admin/audit`, API `/api/audit`, `audit.service`, tracking de navegación).
- Rol **admin** en base de datos (migraciones `006`, `023`, etc.) y hook `useAdmin`.

### 2.16 Notificaciones push

- **Suscripción / baja** (`/api/push/subscribe`, `/api/push/unsubscribe`).
- **Envío**, **prueba** y **programación** (`/api/push/send`, `/api/push/test`, `/api/push/schedule`).
- **Cron en Vercel** (`vercel.json`): llamada periódica a `/api/push/schedule` para recordatorios de rutinas.
- Documentación en [PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md) y [FEEDBACK_NOTIFICATIONS.md](./FEEDBACK_NOTIFICATIONS.md).

### 2.17 PWA y offline

- **next-pwa**, manifest, comportamiento offline parcial según configuración.
- Documentación en [PWA.md](./PWA.md).

### 2.18 Navegación y UX

- **Barra superior** (desktop) y **bottom nav** (móvil) con accesos principales.
- **Drawer “Más”** con acceso a medidas, metas, fotos, herramientas, perfil, tema, admin, etc.
- **Búsqueda global** (`useSearchDialog`) para saltar a contenido.
- **Acceso rápido al Coach IA** desde menú.
- Componentes UI reutilizables (Radix, shadcn-style).

### 2.19 Datos y arquitectura

- **Clean Architecture** con repositorios y servicios de dominio.
- **Row Level Security** en Supabase.
- **Logger** centralizado.
- **Validación** con Zod en esquemas compartidos.
- **Exportación** de datos del usuario (JSON/CSV) en `lib/data/export.ts`.

---

## 3. Posibles mejoras (orientativas)

Las siguientes ideas no constituyen un compromiso de roadmap; priorizar según negocio, coste y métricas.

### 3.1 Producto y UX

- Unificar copy **100 % i18n** en pantallas que aún mezclen idiomas (p. ej. títulos fijos en social o tools).
- **Onboarding** guiado (primera rutina, permisos de notificaciones, tour del dashboard).
- **Accesibilidad:** auditoría WCAG (contraste, foco, lectores de pantalla en drag-and-drop).
- **Modo offline** más explícito: cola de sincronización para entrenos iniciados sin red.

### 3.2 Entrenamiento y datos

- Filtros de listado de workouts por **etiqueta** y búsqueda por **nombre de ejercicio**, no solo notas.
- **Plantillas** de entreno duplicables en un clic; **series calientes** (warm-up) como tipo de set.
- Integración con **wearables** o importación **GPX** para cardio (alcance grande).

### 3.3 Social y moderación

- **Reportar** contenido del feed y **bloqueo** de usuarios.
- Límites de tasa y **sanitización** más estricta en comentarios/chat (abuso, spam).
- Notificaciones push también para **mensajes** o **likes** (opt-in).

### 3.4 IA y costes

- **Caching** y límites por usuario para rutas OpenAI; indicador de “créditos” o uso.
- **Transparencia:** fuentes o métricas usadas en el informe semanal (qué entrenos contaron).
- Modo **offline** del coach: respuestas locales o desactivación elegante sin API key.

### 3.5 Seguridad y operaciones

- Revisión periódica de **RLS** y políticas de Storage; pruebas automatizadas de permisos.
- **Rotación** de claves VAPID y secretos; comprobar que no haya emails de contacto hardcodeados en producción en rutas de push.
- **Observabilidad:** trazas y métricas (latencia API, errores OpenAI, tasa de entrega push).

### 3.6 Calidad y mantenimiento

- Suite **E2E** (Playwright) para flujos críticos: login, crear entreno, rutina, feedback.
- Tests de **contrato** para APIs bajo `/api`.
- Alinear versiones de **ESLint** con Next (evitar advertencias de peer dependencies).

### 3.7 Internacionalización y locales

- Formato de **fechas/números** según `locale` de forma consistente (no solo Colombia donde aplique globalmente).
- Segundo idioma revisado por hablantes nativos (copy en goals, social, admin).

---

## 4. Documentación relacionada

- [README de documentación](./README.md)
- [Arquitectura](./ARCHITECTURE.md)
- [Instalación](./INSTALLATION.md)
- [Despliegue](./DEPLOYMENT.md)
- [Desarrollo](./DEVELOPMENT.md)
- [PWA](./PWA.md)
- [Notificaciones push](./PUSH_NOTIFICATIONS.md)
- [Feedback y notificaciones](./FEEDBACK_NOTIFICATIONS.md)

---

*Última revisión orientativa según estructura del repositorio (incluye rutas bajo `src/app`, APIs, dominio y migraciones Supabase). Actualizar este documento cuando se añadan módulos grandes o se retiren funciones.*
