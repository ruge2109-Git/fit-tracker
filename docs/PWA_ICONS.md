# Generar Íconos PWA

Para que la PWA funcione correctamente en iOS y Android, necesitas generar íconos PNG en diferentes tamaños.

## Tamaños Requeridos

- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-152x152.png` - 152x152px
- `icon-192x192.png` - 192x192px
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px
- `apple-touch-icon.png` - 180x180px (para iOS)

## Métodos para Generar Íconos

### Opción 1: RealFaviconGenerator (Recomendado)

1. Ve a https://realfavicongenerator.net/
2. Sube tu ícono SVG o imagen base
3. Configura los tamaños y opciones
4. Descarga el paquete generado
5. Copia los archivos PNG a `public/icons/`

### Opción 2: Usando Sharp (Node.js)

```bash
npm install sharp --save-dev
```

Luego crea un script `scripts/generate-icons-sharp.js`:

```javascript
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512, 180]
const inputSvg = path.join(__dirname, '../public/icons/icon-192x192.svg')
const outputDir = path.join(__dirname, '../public/icons')

async function generateIcons() {
  for (const size of sizes) {
    const filename = size === 180 
      ? 'apple-touch-icon.png' 
      : `icon-${size}x${size}.png`
    const outputPath = path.join(outputDir, filename)
    
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    
    console.log(`Generated ${filename}`)
  }
}

generateIcons().catch(console.error)
```

Ejecuta:
```bash
node scripts/generate-icons-sharp.js
```

### Opción 3: Usando ImageMagick

```bash
# Instalar ImageMagick primero
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

for size in 72 96 128 144 152 192 384 512; do
  convert public/icons/icon-192x192.svg -resize ${size}x${size} public/icons/icon-${size}x${size}.png
done

convert public/icons/icon-192x192.svg -resize 180x180 public/icons/apple-touch-icon.png
```

### Opción 4: Manualmente con Software de Diseño

1. Abre tu ícono SVG en Figma, Adobe Illustrator, o similar
2. Exporta cada tamaño como PNG
3. Guarda en `public/icons/` con los nombres correctos

## Verificación

Después de generar los íconos, verifica que todos los archivos existan:

```bash
# Windows PowerShell
Get-ChildItem public/icons/*.png | Select-Object Name

# Mac/Linux
ls public/icons/*.png
```

Debes ver:
- apple-touch-icon.png
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Notas

- Los íconos deben ser cuadrados (1:1 aspect ratio)
- Usa colores sólidos y diseños simples para mejor visibilidad
- El ícono de 512x512px es especialmente importante para Android
- El apple-touch-icon.png debe ser exactamente 180x180px para iOS

