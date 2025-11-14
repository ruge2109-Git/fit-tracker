# 🛠️ Guía de Desarrollo - FitTrackr

Guía completa para desarrolladores sobre cómo trabajar con el código de FitTrackr, incluyendo convenciones, herramientas y buenas prácticas.

## 📋 Tabla de Contenidos

1. [Scripts Disponibles](#scripts-disponibles)
2. [Pre-commit Hooks](#pre-commit-hooks)
3. [Convenciones de Código](#convenciones-de-código)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Flujo de Trabajo](#flujo-de-trabajo)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Buenas Prácticas](#buenas-prácticas)

## Scripts Disponibles

### Desarrollo

```bash
npm run dev          # Inicia servidor de desarrollo en http://localhost:3000
npm run build        # Build para producción
npm run start        # Inicia servidor de producción (después de build)
npm run lint         # Ejecuta ESLint
npm run type-check   # Verifica tipos TypeScript sin generar archivos
```

### Utilidades

```bash
npm run pre-commit              # Ejecuta checks pre-commit manualmente
npm run generate-vapid-keys     # Genera claves VAPID para push notifications
```

## Pre-commit Hooks

### Descripción

El script de pre-commit ejecuta automáticamente varias verificaciones antes de cada commit para asegurar que el código cumple con los estándares del proyecto.

### Uso Manual

#### Windows (PowerShell)

```powershell
.\scripts\pre-commit.ps1
```

O usando npm:

```bash
npm run pre-commit
```

#### Linux/Mac (Bash)

```bash
chmod +x scripts/pre-commit.sh
./scripts/pre-commit.sh
```

O usando npm:

```bash
npm run pre-commit
```

### Verificaciones Incluidas

El script ejecuta las siguientes verificaciones en orden:

1. **Type Checking** - Verifica que no haya errores de TypeScript
   ```bash
   npm run type-check
   ```
   - Ejecuta `tsc --noEmit` para verificar tipos sin generar archivos
   - **Falla si hay errores de tipo**

2. **Linting** - Ejecuta ESLint para verificar el estilo del código
   ```bash
   npm run lint
   ```
   - Verifica reglas de ESLint configuradas
   - **Falla si hay errores de linting**

3. **Console Statements** - Detecta uso de `console.log/error/warn`
   - Solo genera **advertencias**, no bloquea el commit
   - Recomienda usar el servicio `logger` centralizado

4. **TODO/FIXME** - Lista todos los comentarios TODO y FIXME en el código
   - Solo genera **advertencias**, no bloquea el commit
   - Útil para tracking de tareas pendientes

### Configurar Git Hooks (Opcional)

Para ejecutar automáticamente antes de cada commit:

#### Windows (PowerShell)

```powershell
# Crear hook de pre-commit
New-Item -Path .git\hooks\pre-commit -ItemType File -Force
Add-Content .git\hooks\pre-commit "powershell -ExecutionPolicy Bypass -File scripts/pre-commit.ps1"
```

#### Linux/Mac

```bash
# Crear hook de pre-commit
ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Notas

- El script falla si encuentra errores de TypeScript o linting
- Los console statements y TODOs solo generan advertencias, no bloquean el commit
- Asegúrate de tener `node_modules` instalados antes de ejecutar

## Convenciones de Código

### Nomenclatura

#### Archivos y Carpetas

- **Componentes React**: PascalCase (`WorkoutCard.tsx`, `ExerciseSelect.tsx`)
- **Utilidades/Servicios**: camelCase (`push.service.ts`, `logger.ts`)
- **Tipos/Interfaces**: PascalCase (`Workout`, `Exercise`, `User`)
- **Constantes**: UPPER_SNAKE_CASE (`VAPID_PUBLIC_KEY`, `MAX_RETRIES`)
- **Carpetas**: kebab-case (`workout-rest-timer`, `push-subscription`)

#### Variables y Funciones

- **Variables**: camelCase (`userName`, `workoutData`)
- **Funciones**: camelCase (`getWorkouts`, `createSubscription`)
- **Componentes**: PascalCase (`WorkoutCard`, `ExerciseSelect`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`, `DEFAULT_TIMEOUT`)

#### Tipos e Interfaces

- **Interfaces**: PascalCase, sin prefijo `I` (`Workout`, `Exercise`)
- **Types**: PascalCase (`WorkoutWithSets`, `ApiResponse`)
- **Enums**: PascalCase (`ExerciseType`, `MuscleGroup`)

### Estructura de Componentes

```typescript
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types/Interfaces
interface ComponentProps {
  title: string
  onAction: () => void
}

// 3. Component
export function Component({ title, onAction }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState()
  
  // 5. Handlers
  const handleClick = () => {
    // ...
  }
  
  // 6. Effects
  useEffect(() => {
    // ...
  }, [])
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Comentarios

- Usa comentarios para explicar **por qué**, no **qué**
- Evita comentarios obvios
- Documenta funciones complejas con JSDoc:

```typescript
/**
 * Calcula el volumen total de un workout
 * @param sets - Array de sets con peso y repeticiones
 * @returns Volumen total en kg
 */
function calculateVolume(sets: Set[]): number {
  // ...
}
```

### Logging

**NO uses `console.log` directamente**. Usa el servicio `logger`:

```typescript
// ❌ Mal
console.log('User logged in')
console.error('Error occurred')

// ✅ Bien
import { logger } from '@/lib/logger'

logger.info('User logged in')
logger.error('Error occurred', { error })
```

## Estructura de Archivos

### Organización por Capas

```
src/
├── app/                    # Next.js App Router (Presentation)
│   ├── [locale]/          # Rutas con i18n
│   └── api/               # API Routes
├── components/            # Componentes React (Presentation)
│   ├── ui/               # Componentes base
│   └── workouts/         # Componentes específicos
├── domain/                # Lógica de negocio (Domain)
│   ├── repositories/     # Acceso a datos
│   └── services/        # Lógica de negocio
├── store/                 # State management (Application)
├── lib/                   # Utilidades (Infrastructure)
└── types/                 # TypeScript types
```

### Agregar una Nueva Feature

1. **Definir tipos** en `src/types/index.ts`
2. **Crear repository** en `src/domain/repositories/` (si necesita acceso a datos)
3. **Crear service** en `src/domain/services/` (si hay lógica compleja)
4. **Crear store** en `src/store/` (si necesita estado global)
5. **Crear componentes** en `src/components/`
6. **Crear página** en `src/app/[locale]/`

## Flujo de Trabajo

### Crear una Nueva Feature

1. **Crear rama:**
   ```bash
   git checkout -b feature/nombre-de-feature
   ```

2. **Desarrollar:**
   - Sigue las convenciones de código
   - Ejecuta `npm run pre-commit` antes de commitear
   - Escribe código limpio y bien documentado

3. **Commit:**
   ```bash
   git add .
   git commit -m "feat: agregar nueva feature"
   ```

4. **Push y Pull Request:**
   ```bash
   git push origin feature/nombre-de-feature
   ```

### Estructura de Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva característica
fix: corrección de bug
docs: cambios en documentación
style: formato, punto y coma faltante, etc.
refactor: refactorización de código
test: agregar o modificar tests
chore: cambios en build, dependencias, etc.
```

Ejemplos:
- `feat: agregar temporizador de descanso`
- `fix: corregir cálculo de volumen en dashboard`
- `docs: actualizar guía de instalación`
- `refactor: simplificar lógica de repositorio`

## Testing

### Type Checking

```bash
npm run type-check
```

Verifica todos los tipos TypeScript sin generar archivos. Útil para CI/CD.

### Linting

```bash
npm run lint
```

Ejecuta ESLint. Para auto-fix:

```bash
npm run lint -- --fix
```

### Testing Manual

1. **Probar en desarrollo:**
   ```bash
   npm run dev
   ```

2. **Probar build:**
   ```bash
   npm run build
   npm start
   ```

3. **Probar en diferentes navegadores:**
   - Chrome
   - Firefox
   - Safari
   - Edge

## Debugging

### Errores de TypeScript

1. Revisa los errores en tu editor
2. Ejecuta `npm run type-check` para ver todos los errores
3. Revisa la documentación de tipos en `src/types/index.ts`

### Errores de Runtime

1. Abre DevTools del navegador (F12)
2. Revisa la consola para errores
3. Revisa la pestaña Network para errores de API
4. Usa breakpoints en el código

### Errores de Build

```bash
# Limpiar caché de Next.js
rm -rf .next
npm run build
```

### Logs del Servidor

Los logs aparecen en la terminal donde ejecutaste `npm run dev`. Usa `logger` para logs estructurados:

```typescript
import { logger } from '@/lib/logger'

logger.info('Operation started', { userId })
logger.error('Operation failed', { error, userId })
```

## Buenas Prácticas

### TypeScript

- ✅ Usa tipos explícitos para props de componentes
- ✅ Evita `any`, usa `unknown` si es necesario
- ✅ Usa interfaces para objetos, types para uniones
- ✅ Aprovecha type inference cuando sea claro

### React

- ✅ Usa componentes funcionales
- ✅ Usa hooks personalizados para lógica reutilizable
- ✅ Mantén componentes pequeños y enfocados
- ✅ Usa `useMemo` y `useCallback` cuando sea necesario

### Estado

- ✅ Usa Zustand para estado global
- ✅ Usa `useState` para estado local
- ✅ Evita prop drilling, usa stores cuando sea necesario

### Acceso a Datos

- ✅ Usa repositorios para acceso a datos
- ✅ No accedas directamente a Supabase desde componentes
- ✅ Maneja errores apropiadamente

### Performance

- ✅ Usa `next/image` para imágenes
- ✅ Implementa lazy loading cuando sea apropiado
- ✅ Optimiza re-renders con `React.memo` cuando sea necesario
- ✅ Usa `dynamic` import para componentes pesados

### Seguridad

- ✅ Nunca commitees variables de entorno
- ✅ Usa RLS en Supabase
- ✅ Valida datos del usuario con Zod
- ✅ Sanitiza inputs del usuario

## Herramientas Recomendadas

### VS Code Extensions

- **ESLint** - Linting en tiempo real
- **Prettier** - Formateo de código
- **TypeScript** - Soporte TypeScript
- **Tailwind CSS IntelliSense** - Autocompletado de Tailwind

### Navegadores

- **Chrome DevTools** - Debugging
- **React DevTools** - Inspeccionar componentes React
- **Redux DevTools** - Inspeccionar estado (si usas Redux)

## Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Happy Coding! 💪**

