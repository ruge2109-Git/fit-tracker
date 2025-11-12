/**
 * Notification Settings Component
 * Allows users to enable/disable notifications
 */

'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Check, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { notificationService } from '@/lib/notifications/notification.service'
import { pushService } from '@/lib/notifications/push.service'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth.store'
import { logger } from '@/lib/logger'

export function NotificationSettings() {
  const t = useTranslations('notifications')
  const { user } = useAuthStore()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)


  const checkPushSubscription = async () => {
    if (!pushService.isSupported()) return
    const subscription = await pushService.getSubscription()
    setIsSubscribed(!!subscription)
  }

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }

    if (pushService.isSupported()) {
      setIsPushSupported(true)
      checkPushSubscription()
    }
  }, [])

  useEffect(() => {
    // Re-check subscription when permission is granted
    if (permission === 'granted' && isPushSupported) {
      checkPushSubscription()
    }
  }, [permission, isPushSupported])

  const handleEnable = async () => {
    setIsLoading(true)
    try {
      const granted = await notificationService.requestPermission()
      setPermission(Notification.permission)

      if (granted) {
        toast.success(t('enabledSuccess'))
        
        // Try to enable push notifications if supported
        if (isPushSupported && user) {
          // Small delay to ensure permission is fully granted
          setTimeout(async () => {
            const subscription = await pushService.subscribe()
            if (subscription) {
              // Save to backend
              const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription),
              })

              if (response.ok) {
                setIsSubscribed(true)
                toast.success(t('pushEnabled') || 'Push notifications enabled!')
              } else {
                const errorData = await response.json().catch(() => ({}))
                toast.error(errorData.error || t('pushFailed') || 'Failed to enable push notifications')
              }
            }
          }, 500)
        }
        
        // Test notification
        await notificationService.showTestNotification()
      } else {
        toast.error(t('permissionDenied'))
      }
    } catch (error) {
      toast.error(t('error') || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnablePush = async () => {
    setIsLoading(true)
    try {
      if (!user) {
        toast.error(t('error') || 'You must be logged in')
        return
      }

      if (!isPushSupported) {
        toast.error(t('pushNotSupported') || 'Push notifications are not supported in this browser')
        return
      }

      // Ensure we have notification permission
      if (permission !== 'granted') {
        const granted = await notificationService.requestPermission()
        setPermission(Notification.permission)
        if (!granted) {
          toast.error(t('permissionDenied'))
          return
        }
      }

      // Subscribe to push notifications
      const subscription = await pushService.subscribe()
      if (subscription) {
        // Save to backend
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })

        if (response.ok) {
          setIsSubscribed(true)
          toast.success(t('pushEnabled') || 'Push notifications enabled!')
        } else {
          const errorData = await response.json().catch(() => ({}))
          toast.error(errorData.error || t('pushFailed') || 'Failed to enable push notifications')
        }
      } else {
        toast.error(t('pushFailed') || 'Failed to subscribe to push notifications')
      }
    } catch (error) {
      logger.error('Failed to enable push notifications', error as Error, 'NotificationSettings')
      toast.error(t('error') || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisablePush = async () => {
    setIsLoading(true)
    try {
      const subscription = await pushService.getSubscription()
      if (subscription) {
        await pushService.unsubscribe()
        
        if (user) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          })
        }

        setIsSubscribed(false)
        toast.success(t('pushDisabled') || 'Push notifications disabled')
      }
    } catch (error) {
      toast.error(t('error') || 'An error occurred')
    } finally {
      setIsLoading(false)
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

        {isPushSupported && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t('pushNotifications') || 'Push Notifications'}
                </span>
              </div>
              {isSubscribed ? (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {t('active') || 'Active'}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t('inactive') || 'Inactive'}
                </span>
              )}
            </div>
            {isSubscribed ? (
              <Button 
                onClick={handleDisablePush} 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={isLoading}
              >
                {t('disablePush') || 'Disable Push Notifications'}
              </Button>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('pushDescription') || 'Enable push notifications to receive reminders even when the app is closed'}
                </p>
                {permission === 'granted' && (
                  <Button 
                    onClick={handleEnablePush} 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Smartphone className="h-3 w-3 mr-2" />
                    {t('enablePush') || 'Enable Push Notifications'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {permission !== 'granted' && (
          <Button onClick={handleEnable} className="w-full" disabled={isLoading}>
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

