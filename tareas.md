# Lista de Tareas - FitTrackr

Este archivo contiene las tareas pendientes, mejoras identificadas y correcciones necesarias basadas en el análisis del proyecto.

## 🛠️ Mejoras Prioritarias

### Infraestructura Offline-First
- [x] **Integrar Repositorios con OfflineDB**: Modificar `BaseRepository` para manejar caché local de IndexedDB de forma transparente.
  - `BaseRepository` con `fetchWithOfflineFallback` y `mutateWithOfflineSupport`
  - 14 repositorios migrados (exercise, workout, routine, set, goal, tag, workout-tag, body-measurement, progress-photo, audit-log, feedback, push-subscription, saved-filter)
  - Nuevos stores en IndexedDB: `goal_progress`, `routine_exercises`
- [x] **Sincronización Automática**: Implementar lógica en los servicios para añadir cambios a `syncQueue` automáticamente cuando falla la red.
  - `mutateWithOfflineSupport` detecta `!navigator.onLine` o errores de red y encola en `syncQueue`
  - `sync.ts` con `repositoryRegistry` procesa todos los tipos de entidades
  - `use-offline.ts` hook llama a `syncService.sync()` al reconectarse
- [x] **Resolución de Conflictos**: Diseñar e implementar una estrategia básica de resolución ("último gana con aviso" basado en timestamps).
  - `localUpdatedAt` en cada `SyncItem`
  - En `sync.ts`, antes de hacer update consulta versión del servidor vía `findById`
  - Si `server.updated_at > localUpdatedAt` → log + contador de conflictos en toast
  - Límite de 5 reintentos por item, luego se descarta con warning

### Rendimiento y UI
- [ ] **Actualizaciones Optimistas (Optimistic UI)**: Añadir soporte para `onMutate` en las acciones de los stores principales (`WorkoutStore`, `GoalStore`).
- [ ] **Refactorización de WorkoutStore**: Extraer la lógica de auditoría y PRs a un servicio de orquestación o hook dedicado.
- [ ] **Modo Compacto**: Diseñar e implementar una interfaz más densa para el seguimiento de ejercicios en móviles.

### Calidad y Seguridad
- [ ] **Corrección de Registro (Auth Race Condition)**: Reemplazar el `setTimeout` por un listener reactivo o reintentos en `AuthService.signUp`.
- [ ] **Suite de Pruebas**:
    - [ ] Configurar Vitest para lógica de servicios.
    - [ ] Configurar Playwright para flujos de autenticación.
- [ ] **Auditoría de RLS**: Revisar todas las políticas de Supabase para las tablas de `social` (amigos, chats).

---

## 🚀 Próximas Funcionalidades (Ideas)

- [ ] **AI Coach Proactivo**: Implementar sugerencias inteligentes basadas en el historial (ej. "Parece que te estancaste en Press de Banca, ¿intentamos bajar el peso y subir reps?").
- [ ] **Sincronización Multi-dispositivo en tiempo real**: Usar Supabase Realtime para ver el entrenamiento activo en varios dispositivos.
- [ ] **Exportación de Datos**: Mejorar la generación de PDFs y añadir exportación a CSV/Excel.

---

## 🐞 Bugs Identificados / Por Resolver

- [x] Bug potencial: Duplicidad en el disparador de sincronización (`online` event listener doble).
  - Resuelto: se eliminó el listener module-level en `sync.ts` (line 99-104). El hook `use-offline.ts` ya maneja el evento correctamente con cleanup.
- [x] Bug potencial: Bloqueo de cola de sincronización ante errores de validación permanentes.
  - Resuelto: se agregó `retryCount` a `SyncItem`. Máximo 5 reintentos, después se descarta con toast warning.
