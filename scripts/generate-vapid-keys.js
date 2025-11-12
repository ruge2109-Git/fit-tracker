/**
 * Generate VAPID Keys for Web Push Notifications
 * Run: npm run generate-vapid-keys
 */

try {
  const webpush = require('web-push')

  console.log('Generating VAPID keys...\n')

  const vapidKeys = webpush.generateVAPIDKeys()

  console.log('✅ VAPID Keys Generated!\n')
  console.log('Add these to your .env.local file:\n')
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
  console.log('\n⚠️  Keep VAPID_PRIVATE_KEY secret! Never commit it to git.\n')
  console.log('Also update the email in:')
  console.log('- src/app/api/push/send/route.ts')
  console.log('- src/app/api/push/schedule/route.ts')
  console.log('Change "your-email@example.com" to your actual email address.\n')
} catch (error) {
  console.error('Error: web-push package not found.')
  console.error('Please run: npm install web-push --save\n')
  process.exit(1)
}

