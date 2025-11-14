# 🏗️ Arquitectura de FitTrackr

Este documento describe la arquitectura del proyecto, principios de diseño y patrones implementados.

## 📐 Principios de Diseño

### SOLID Principles

El proyecto sigue estrictamente los principios SOLID:

#### Single Responsibility Principle (SRP)
- Cada clase/componente tiene una sola responsabilidad
- Ejemplos:
  - `Logger` - Solo logging
  - `WorkoutRepository` - Solo acceso a datos de workouts
  - `StatsService` - Solo cálculos de estadísticas

#### Open/Closed Principle (OCP)
- Componentes abiertos para extensión, cerrados para modificación
- `BaseRepository` puede extenderse sin modificar su implementación
- Componentes UI son composables y extensibles

#### Liskov Substitution Principle (LSP)
- Todas las implementaciones de `IBaseRepository` son intercambiables
- Los repositorios pueden ser mockeados para testing

#### Interface Segregation Principle (ISP)
- Interfaces pequeñas y específicas
- `IBaseRepository<T>` define solo operaciones CRUD básicas
- Tipos específicos para cada dominio

#### Dependency Inversion Principle (DIP)
- Dependencias de abstracciones, no implementaciones
- Servicios dependen de interfaces de repositorios
- Logger como abstracción para logging

## 🏛️ Clean Architecture

El proyecto sigue Clean Architecture con separación de capas:

```
┌─────────────────────────────────────┐
│      Presentation Layer             │
│  (React Components, Pages, UI)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Application Layer              │
│  (Services, Use Cases, Stores)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Domain Layer                   │
│  (Repositories, Interfaces)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Infrastructure Layer              │
│  (Supabase, IndexedDB, Logger)      │
└─────────────────────────────────────┘
```

### Capas

#### 1. Presentation Layer (`src/app`, `src/components`)
- **Responsabilidad**: UI, interacción con usuario
- **Dependencias**: Application Layer
- **Tecnologías**: React, Next.js, Tailwind CSS

#### 2. Application Layer (`src/store`, `src/domain/services`)
- **Responsabilidad**: Lógica de negocio, orquestación
- **Dependencias**: Domain Layer
- **Tecnologías**: Zustand, TypeScript

#### 3. Domain Layer (`src/domain/repositories`)
- **Responsabilidad**: Abstracciones de acceso a datos
- **Dependencias**: Infrastructure Layer (interfaces)
- **Tecnologías**: TypeScript interfaces

#### 4. Infrastructure Layer (`src/lib/supabase`, `src/lib/offline`)
- **Responsabilidad**: Implementación concreta de acceso a datos
- **Dependencias**: Ninguna (capa más baja)
- **Tecnologías**: Supabase, IndexedDB

## 🔄 Patrones de Diseño

### Repository Pattern

**Ubicación**: `src/domain/repositories/`

**Propósito**: Abstraer el acceso a datos

```typescript
// Interface
interface IBaseRepository<T> {
  findById(id: string): Promise<ApiResponse<T>>
  findAll(): Promise<ApiResponse<T[]>>
  create(data: Partial<T>): Promise<ApiResponse<T>>
  update(id: string, data: Partial<T>): Promise<ApiResponse<T>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

// Implementación
class WorkoutRepository extends BaseRepository<Workout> {
  // Implementación específica
}
```

**Beneficios**:
- Fácil de testear (mock repositories)
- Intercambiable (puede cambiar de Supabase a otra DB)
- Consistente (mismo patrón para todos los recursos)

### Service Layer Pattern

**Ubicación**: `src/domain/services/`

**Propósito**: Encapsular lógica de negocio compleja

```typescript
class StatsService {
  async getVolumeByWeek(userId: string): Promise<VolumeByWeek[]>
  async getPersonalRecords(userId: string): Promise<PersonalRecord[]>
  // Lógica de negocio compleja
}
```

**Beneficios**:
- Separación de responsabilidades
- Reutilizable
- Testeable independientemente

### Observer Pattern

**Ubicación**: `src/store/`

**Propósito**: State management reactivo

```typescript
const useWorkoutStore = create<WorkoutStore>((set) => ({
  workouts: [],
  loadWorkouts: async (userId) => {
    // Carga datos
    set({ workouts: data })
  }
}))
```

**Beneficios**:
- Reactividad automática
- Desacoplamiento
- Fácil de usar en componentes

### Factory Pattern

**Ubicación**: `src/lib/supabase/`

**Propósito**: Crear clientes Supabase

```typescript
export function createClient() {
  return createBrowserClient(url, key)
}
```

### Adapter Pattern

**Ubicación**: `src/lib/offline/db.ts`

**Propósito**: Adaptar IndexedDB a interfaz similar a Supabase

## 📁 Estructura de Directorios

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internacionalización
│   │   ├── (dashboard)/   # Rutas protegidas
│   │   └── auth/          # Autenticación
│   └── layout.tsx         # Layout raíz
│
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── charts/           # Gráficas
│   ├── workouts/         # Componentes de workouts
│   ├── exercises/        # Componentes de ejercicios
│   ├── routines/         # Componentes de rutinas
│   ├── navigation/       # Navegación
│   ├── tools/            # Herramientas
│   └── providers/        # Context providers
│
├── domain/               # Capa de dominio
│   ├── repositories/     # Repositorios (acceso a datos)
│   └── services/         # Servicios (lógica de negocio)
│
├── store/                # Zustand stores
│   ├── auth.store.ts
│   ├── workout.store.ts
│   └── exercise.store.ts
│
├── lib/                  # Utilidades
│   ├── supabase/         # Clientes Supabase
│   ├── offline/          # Offline mode (IndexedDB)
│   ├── notifications/    # Notificaciones
│   ├── logger.ts         # Servicio de logging
│   ├── utils.ts          # Funciones helper
│   └── constants.ts      # Constantes
│
├── types/                # TypeScript types
│   └── index.ts
│
├── hooks/                # Custom hooks
│   ├── use-offline.ts
│   └── use-notifications.ts
│
└── i18n/                 # Internacionalización
    ├── routing.ts
    └── request.ts
```

## 🔐 Flujo de Datos

### Crear un Workout

```
User Action
    ↓
Component (WorkoutForm)
    ↓
Store (useWorkoutStore.createWorkout)
    ↓
Service (WorkoutService.createWithSets)
    ↓
Repository (WorkoutRepository.create)
    ↓
Supabase (Database)
    ↓
Response
    ↓
Store Update
    ↓
UI Re-render
```

### Cargar Estadísticas

```
Component (Dashboard)
    ↓
useEffect
    ↓
StatsService.getVolumeByWeek
    ↓
WorkoutRepository.findAll
    ↓
Supabase Query
    ↓
Process Data
    ↓
Return Stats
    ↓
Component State
    ↓
Render Charts
```

## 🧪 Testabilidad

La arquitectura facilita el testing:

### Unit Tests
- **Repositories**: Mock Supabase client
- **Services**: Mock repositories
- **Components**: Mock stores y servicios

### Integration Tests
- Testear flujos completos
- Mock solo la capa de infraestructura

### Ejemplo de Test

```typescript
// Mock repository
const mockRepository = {
  findAll: jest.fn().mockResolvedValue({ data: mockWorkouts })
}

// Test service
const statsService = new StatsService(mockRepository)
const volume = await statsService.getVolumeByWeek('user-id')
expect(volume).toBeDefined()
```

## 🚀 Escalabilidad

La arquitectura permite:

1. **Agregar nuevas features** sin modificar código existente
2. **Cambiar implementaciones** (ej: cambiar de Supabase a otra DB)
3. **Agregar nuevas capas** (ej: cache layer)
4. **Microservicios** - Cada servicio puede ser independiente

## 📊 Decisiones de Arquitectura

### ¿Por qué Zustand en lugar de Redux?
- Más simple y menos boilerplate
- Mejor performance
- Suficiente para las necesidades del proyecto

### ¿Por qué Repository Pattern?
- Facilita testing
- Permite cambiar de Supabase a otra DB fácilmente
- Consistencia en acceso a datos

### ¿Por qué Service Layer?
- Separa lógica de negocio de UI
- Reutilizable
- Testeable

### ¿Por qué Clean Architecture?
- Mantenibilidad a largo plazo
- Testabilidad
- Escalabilidad

## 🔄 Flujo de Desarrollo

1. **Nueva Feature**:
   - Definir tipos en `src/types/`
   - Crear repository en `src/domain/repositories/`
   - Crear service si hay lógica compleja
   - Crear store si necesita estado global
   - Crear componentes en `src/components/`
   - Crear página en `src/app/`

2. **Testing**:
   - Mock repositories
   - Test services
   - Test components con React Testing Library

3. **Deployment**:
   - Build pasa type-check y lint
   - Deploy a Vercel
   - Variables de entorno configuradas

---

**Última actualización**: 14/11/2025

