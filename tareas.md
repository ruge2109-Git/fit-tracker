# FitTrackr - Tareas y Mejoras

Análisis detallado del proyecto con categorización de issues, deuda técnica, mejoras de diseño y features propuestas.

---

## 🐛 Posibles Bugs

### 1. ExportWorkoutsButton - Sobrecarga de memoria
- **Ubicación**: `src/components/workouts/export-workouts-button.tsx:41-45`
- **Descripción**: `Promise.all()` carga todos los entrenamientos en paralelo sin límite
- **Impacto**: Alto - crash con miles de entrenamientos
- **Solución**: Chunking de 50-100 entrenamientos por batch

### 2. CSV Import - Type casting inseguro
- **Ubicación**: `src/lib/data/import.ts:287-289`
- **Descripción**: `type` y `muscle_group` forzados como `any` sin validación
- **Impacto**: Medio - datos inconsistentes
- **Solución**: Mapear a enums válidos

### 3. PDF Export - Sin validación de tamaño
- **Ubicación**: `src/lib/pdf-export.ts`
- **Impacto**: Medio - puede freezear navegador
- **Solución**: Limit entrenamientos o split en múltiples PDFs

### 4. CSV Export - URL.revokeObjectURL frágil
- **Ubicación**: `src/lib/csv-export.ts:111`
- **Problema**: setTimeout(100ms) puede no ser suficiente
- **Impacto**: Bajo - memory leak potencial

### 5. Workout Service - Rollback incompleto
- **Ubicación**: `src/domain/services/workout.service.ts:65-66`
- **Problema**: Si delete falla, datos quedan inconsistentes
- **Impacto**: Bajo-Medio

### 6. Data Import - Sin límite de tamaño archivo
- **Ubicación**: `src/lib/data/import.ts:154-155`
- **Problema**: file.text() sin validación puede cargar >50MB
- **Impacto**: Bajo-Medio

---

## 💾 Deuda Técnica

### 1. TODO: CSV import incompleto
- Ubicación: `src/lib/data/import.ts:337-341`
- Falta: Import de ejercicios y rutinas desde CSV
- Prioridad: Media | Tiempo: 2-3 horas

### 2. CSV Parsing manual
- Ubicación: `src/lib/data/import.ts:168-202`
- Problema: Edge cases no manejados
- Alternativa: Usar papaparse

### 3. Falta de Tests Unitarios
- Sin tests: services, import, export, components críticos
- Prioridad: ALTA - impide refactorización segura
- Archivos: *.service.ts, csv-export, import, export-button

### 4. Validación duplicada
- Ubicación: import.ts y validator.ts
- Solución: Centralizar validaciones

### 5. Logger simplista
- Sin: niveles (DEBUG/INFO/WARN/ERROR), timestamps, stack traces
- Alternativa: Winston o Pino

### 6. Error handling inconsistente
- Mix de ApiResponse<T> y exceptions
- Solución: Patrón único en todos servicios

### 7. Tipos con any
- src/lib/data/import.ts:288-289
- type: 'strength' as any, muscle_group: 'full_body' as any

### 8. Gestión manual de Object URLs
- src/lib/csv-export.ts, pdf-export.ts
- Problema: Memory leaks potenciales
- Solución: Utility function con lifecycle

---

## 🎨 Mejoras de Diseño

### 1. Caché de exports
- Cada click = nuevas queries
- Solución: TanStack Query cache
- Beneficio: -50-70% latencia

### 2. Rate limiting en exports
- Sin límite de exports/minuto
- Solución: 1 export per 5 segundos
- Implementación: useRateLimitedAction hook

### 3. Progreso visible en exports
- Problema: Spinner sin contexto
- Solución: Toast "Cargando 500 entrenamientos..."

### 4. Validación PRE-creación
- Ubicación: workout.service.ts:45-72
- Actualmente: Valida DESPUÉS de crear
- Solución: Validar ANTES

### 5. Abstracción export logic
- Problema: fetch+export en componente
- Solución: Hook useWorkoutExport()

### 6. Mejor manejo errores import
- Warnings no se muestran claramente
- Solución: Modal con lista de errores + skip option

### 7. Transacciones reales
- Ubicación: workout.service.ts:65
- Solución: Supabase RLS policies + triggers

### 8. Patrón Repository + Mapper
- Problema: Services hacen fetch + validación + transform
- Solución: Separar en 3 capas claras

### 9. Modals global state
- Problema: State hardcodeado en componentes
- Solución: Zustand store para UI

### 10. Sincronización cross-tab
- Problema: Tab A exporta, Tab B no se actualiza
- Solución: BroadcastChannel API

---

## ✨ Features que Agregarían Valor

### ALTO VALOR (Categoría A)

1. Dashboard Avanzado (3-5 días)
   - Gráficos de tendencia + proyección
   - Comparativa mes vs mes
   - Heatmap frecuencia
   - One-rep-max histórico
   - Tech: Recharts (ya instalado)

2. Recomendaciones IA (2-3 días)
   - Ejercicios faltantes (muscle groups)
   - Alerta si >7 días sin entrenar
   - Recomendar aumento peso
   - Tech: OpenAI API (ya instalada)

3. Análisis de Volumen (1 día)
   - Total tonnage semana/mes
   - Balance muscular por grupo

### MEDIO VALOR (Categoría B)

4. Wearables (4-6 días)
   - Apple Health, Google Fit, Garmin
   - Importar calorías quemadas

5. Sincronización realtime (2 días)
   - Cross-device sync con Supabase realtime

6. Importar de otras apps (3-5 días)
   - Strong, FitBod, JEFIT

### MEDIO VALOR (Categoría C)

7. Compartir entrenamientos (3 días)
   - Link + clone + comments

8. Leaderboards públicos (4-5 días)
   - Trending, rating, rankings

### BAJO-MEDIO VALOR (Categoría D)

9. Workout Templates (2 días)
   - Presets, quick-start, versionado

10. Historial / Undo (2-3 días)
    - Ver cambios, revertir, auditoría

11. Modo Training (3 días)
    - Full-screen, voice commands, vibración

12. Comparación visual (1 día)
    - Este vs hace 4 semanas

### TÉCNICO (Categoría E)

13. Offline sync mejorada (3-4 días)
    - Queue offline, conflict resolution

14. Búsqueda global (1-2 días)
    - Fuzzy search, historial

15. Dark mode+ (1 día)
    - AMOLED, temas personalizados

### BUSINESS (Categoría F)

16. Premium features
    - Exports ilimitados, analytics, support

17. Badges & Achievements (2 días)
    - Gamification, sharable

---

## 📋 Roadmap Recomendado

### Week 1-2 (Quick Wins)
- [ ] Chunking en exports
- [ ] Tests básicos services
- [ ] Progreso visible exports
- [ ] Comparación sesiones
- [ ] Rate limiting

### Week 3-4 (Medium Term)
- [ ] Dashboard avanzado
- [ ] Recomendaciones IA
- [ ] Compartir entrenamientos
- [ ] CSV import completo
- [ ] Realtime sync

### Month 2-3 (Long Term)
- [ ] Wearables
- [ ] Leaderboards
- [ ] Voice commands
- [ ] Audit UI

---

## ✅ Notas Finales

- TypeScript: Excelente strict:true, mantener
- Architecture: Services/components bien separados
- Testing: CRÍTICO - Jest + React Testing Library
- Escalabilidad: Supabase+RLS soporta 100k+ usuarios
- Mobile: PWA existe, considerar React Native después
