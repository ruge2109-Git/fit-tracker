/**
 * Notification Settings Component
 * Allows users to enable/disable notifications
 */

'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { notificationService } from '@/lib/notifications/notification.service'
import { toast } from 'sonner'

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const handleEnable = async () => {
    const granted = await notificationService.requestPermission()
    setPermission(Notification.permission)

    if (granted) {
      toast.success('Notifications enabled!')
      // Test notification
      await notificationService.showTestNotification()
    } else {
      toast.error('Notification permission denied')
    }
  }

  const handleTest = async () => {
    await notificationService.showTestNotification()
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Browser notifications are not supported</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {permission === 'granted' ? (
            <Bell className="h-5 w-5 text-green-500" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          Notifications
        </CardTitle>
        <CardDescription>
          Get reminders for your scheduled workout routines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Status</p>
            <p className="text-sm text-muted-foreground">
              {permission === 'granted' && (
                <span className="flex items-center gap-2 text-green-500">
                  <Check className="h-4 w-4" />
                  Enabled
                </span>
              )}
              {permission === 'denied' && (
                <span className="text-red-500">Blocked - Check browser settings</span>
              )}
              {permission === 'default' && (
                <span className="text-muted-foreground">Not enabled</span>
              )}
            </p>
          </div>
        </div>

        {permission !== 'granted' && (
          <Button onClick={handleEnable} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
        )}

        {permission === 'granted' && (
          <Button onClick={handleTest} variant="outline" className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Test Notification
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          You'll receive reminders at 8 AM on days when you have scheduled routines.
        </p>
      </CardContent>
    </Card>
  )
}

