/**
 * Generate PWA Icons
 * This script creates placeholder icons for PWA
 * In production, replace these with actual designed icons
 */

const fs = require('fs')
const path = require('path')

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]
const publicDir = path.join(__dirname, '..', 'public', 'icons')

// Create icons directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Create a simple SVG icon template
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#221.2 83.2% 53.3%"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">FT</text>
</svg>`

console.log('Generating PWA icons...')

iconSizes.forEach(size => {
  const svg = createSVGIcon(size)
  const filePath = path.join(publicDir, `icon-${size}x${size}.svg`)
  fs.writeFileSync(filePath, svg)
  console.log(`Created: icon-${size}x${size}.svg`)
})

console.log('\n✅ Icons generated!')
console.log('⚠️  Note: These are placeholder SVG icons. For production, replace with actual PNG icons.')
console.log('   You can use tools like: https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator')

