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
import { useTranslations } from 'next-intl'

export function NotificationSettings() {
  const t = useTranslations('notifications')
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
      toast.success(t('enabledSuccess'))
      // Test notification
      await notificationService.showTestNotification()
    } else {
      toast.error(t('permissionDenied'))
    }
  }

  const handleTest = async () => {
    await notificationService.showTestNotification()
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('notSupported')}</CardDescription>
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
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t('status')}</p>
            <p className="text-sm text-muted-foreground">
              {permission === 'granted' && (
                <span className="flex items-center gap-2 text-green-500">
                  <Check className="h-4 w-4" />
                  {t('enabled')}
                </span>
              )}
              {permission === 'denied' && (
                <span className="text-red-500">{t('blocked')}</span>
              )}
              {permission === 'default' && (
                <span className="text-muted-foreground">{t('notEnabled')}</span>
              )}
            </p>
          </div>
        </div>

        {permission !== 'granted' && (
          <Button onClick={handleEnable} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            {t('enableNotifications')}
          </Button>
        )}

        {permission === 'granted' && (
          <Button onClick={handleTest} variant="outline" className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            {t('testNotification')}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          {t('reminderText')}
        </p>
      </CardContent>
    </Card>
  )
}

