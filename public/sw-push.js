self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim()
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
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
    silent: false,
    renotify: true,
    dir: 'ltr',
    lang: 'es',
    timestamp: Date.now(),
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'FitTrackr', options)
      .then(() => {
        return new Promise(resolve => setTimeout(resolve, 1000))
      })
      .catch((error) => {
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
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener('notificationclose', (event) => {
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'UPDATE_TIMER_BADGE') {
    const { seconds, timeString, updateNotification } = event.data
    
    if (updateNotification !== false && seconds !== null && seconds > 0 && timeString) {
      const mins = Math.ceil(seconds / 60)
      self.registration.showNotification('⏱️ ' + timeString, {
        body: `Descanso: ${mins} minuto${mins !== 1 ? 's' : ''} restante${mins !== 1 ? 's' : ''}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'rest-timer-active',
        requireInteraction: false,
        silent: true,
        renotify: true,
        data: {
          url: '/',
          timerActive: true,
        },
      }).catch(() => {})
    } else if (seconds === null || seconds === 0) {
      self.registration.getNotifications({ tag: 'rest-timer-active' }).then(notifications => {
        notifications.forEach(notification => notification.close())
      })
    }
  }
})

