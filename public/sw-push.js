/**
 * Service Worker for Push Notifications
 * Handles incoming push notifications and displays them
 * Also handles local notifications shown via registration.showNotification()
 */

// Install event - ensure service worker is active
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting() // Activate immediately
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    clients.claim() // Take control of all pages immediately
  )
  console.log('Service Worker activated')
})

self.addEventListener('push', (event) => {
  console.log('Push event received:', event)
  console.log('Service Worker state:', self.registration.active ? 'active' : 'inactive')
  
  let data = {}
  
  if (event.data) {
    try {
      data = event.data.json()
      console.log('Push data parsed:', data)
    } catch (e) {
      console.error('Error parsing push data:', e)
      data = { body: event.data.text() }
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    // Important for mobile: ensure notification is shown even when app is closed
    silent: false,
    renotify: true,
    // Additional options for better mobile support
    dir: 'ltr',
    lang: 'es',
    timestamp: Date.now(),
  }

  console.log('Showing notification with options:', options)

  // Use waitUntil to keep service worker alive during notification
  event.waitUntil(
    self.registration.showNotification(data.title || 'FitTrackr', options)
      .then(() => {
        console.log('Notification shown successfully')
        // Keep service worker alive a bit longer
        return new Promise(resolve => setTimeout(resolve, 1000))
      })
      .catch((error) => {
        console.error('Error showing notification:', error)
        throw error
      })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const urlToOpen = data.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener('notificationclose', (event) => {
  // Handle notification close if needed
  console.log('Notification closed:', event.notification.tag, 'Title:', event.notification.title)
})

// Handle messages from the page (for debugging)
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

