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