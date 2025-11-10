# Pre-commit Script

Este documento explica cómo usar el script de pre-commit para mantener la calidad del código antes de cada commit.

## 📋 Descripción

El script de pre-commit ejecuta automáticamente varias verificaciones antes de cada commit para asegurar que el código cumple con los estándares del proyecto.

## 🚀 Uso

### Windows (PowerShell)

```powershell
.\scripts\pre-commit.ps1
```

O usando npm:

```bash
npm run pre-commit
```

### Linux/Mac (Bash)

```bash
chmod +x scripts/pre-commit.sh
./scripts/pre-commit.sh
```

## ✅ Verificaciones Incluidas

El script ejecuta las siguientes verificaciones en orden:

1. **Type Checking**: Verifica que no haya errores de TypeScript
   ```bash
   npm run type-check
   ```
   - Ejecuta `tsc --noEmit` para verificar tipos sin generar archivos
   - Falla si hay errores de tipo

2. **Linting**: Ejecuta ESLint para verificar el estilo del código
   ```bash
   npm run lint
   ```
   - Verifica reglas de ESLint configuradas
   - Falla si hay errores de linting

3. **Console Statements**: Detecta uso de `console.log/error/warn` (debería usarse `logger`)
   - Solo genera advertencias, no bloquea el commit
   - Recomienda usar el servicio `logger` centralizado

4. **TODO/FIXME**: Lista todos los comentarios TODO y FIXME en el código
   - Solo genera advertencias, no bloquea el commit
   - Útil para tracking de tareas pendientes

## 🔧 Configuración

### Git Hooks (Opcional)

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

## 📝 Notas

- El script falla si encuentra errores de TypeScript o linting
- Los console statements y TODOs solo generan advertencias, no bloquean el commit
- Asegúrate de tener `node_modules` instalados antes de ejecutar

## 🛠️ Solución de Problemas

### Error: "Not a git repository"
- Asegúrate de estar en la raíz del proyecto
- Verifica que `.git` existe

### Error: "node_modules not found"
- Ejecuta `npm install` primero

### Type check falla
- Revisa los errores de TypeScript
- Ejecuta `npm run type-check` para ver detalles

### Linting falla
- Revisa los errores de ESLint
- Ejecuta `npm run lint` para ver detalles
- Algunos errores pueden auto-fixearse con `npm run lint -- --fix`

