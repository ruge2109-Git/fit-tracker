/**
 * Workout Rest Timer Component
 * Compact floating timer for use during workouts
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer, X, Minimize2, Maximize2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'

const STORAGE_KEY = 'workout-rest-timer'

interface TimerState {
  duration: number
  timeLeft: number
  isRunning: boolean
  isFinished: boolean
  startTime: number | null
}

const getInitialState = (): { duration: number; timeLeft: number; isRunning: boolean; isFinished: boolean; startTime: number | null } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state: TimerState = JSON.parse(saved)
      if (state.isRunning && state.startTime) {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
        const newTimeLeft = Math.max(0, state.duration - elapsed)
        return {
          duration: state.duration,
          timeLeft: newTimeLeft,
          isRunning: newTimeLeft > 0,
          isFinished: newTimeLeft === 0,
          startTime: newTimeLeft > 0 ? state.startTime : null
        }
      } else {
        return {
          duration: state.duration,
          timeLeft: state.timeLeft,
          isRunning: false,
          isFinished: state.isFinished,
          startTime: null
        }
      }
    }
  } catch (e) {
  }
  return {
    duration: 90,
    timeLeft: 90,
    isRunning: false,
    isFinished: false,
    startTime: null
  }
}

export function WorkoutRestTimer() {
  const t = useTranslations('restTimer')
  const initialState = getInitialState()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [duration, setDuration] = useState(initialState.duration)
  const [timeLeft, setTimeLeft] = useState(initialState.timeLeft)
  const [isRunning, setIsRunning] = useState(initialState.isRunning)
  const [isFinished, setIsFinished] = useState(initialState.isFinished)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(initialState.startTime)
  const durationRef = useRef<number>(initialState.duration)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true
    
    if (initialState.isRunning && initialState.startTime) {
      startTimeRef.current = initialState.startTime
      setIsRunning(true)
    }
  }, [initialState.isRunning, initialState.startTime])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const newTimeLeft = Math.max(0, durationRef.current - elapsed)
        setTimeLeft(newTimeLeft)
        if (newTimeLeft === 0) {
          setIsRunning(false)
          setIsFinished(true)
          playSound()
          updateBadge(null)
          startTimeRef.current = null
          saveState({ duration: durationRef.current, timeLeft: 0, isRunning: false, isFinished: true, startTime: null })
          showTimerNotification()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  const showTimerNotification = async () => {
    if (!('Notification' in window)) return
    
    if (Notification.permission !== 'granted') {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
      } catch (e) {
        return
      }
    }

    const notificationOptions = {
      body: t('restComplete') || 'Rest time is complete!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'rest-timer-complete',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      silent: false,
      data: {
        url: window.location.href,
      },
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(
          t('restTimerComplete') || 'FitTrackr - Rest Complete',
          notificationOptions
        )
      } catch (e) {
        new Notification(
          t('restTimerComplete') || 'FitTrackr - Rest Complete',
          notificationOptions
        )
      }
    } else {
      new Notification(
        t('restTimerComplete') || 'FitTrackr - Rest Complete',
        notificationOptions
      )
    }
  }

  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      const updateTimer = () => {
        const now = Date.now()
        if (startTimeRef.current) {
          const elapsed = Math.floor((now - startTimeRef.current) / 1000)
          const newTimeLeft = Math.max(0, durationRef.current - elapsed)
          
          setTimeLeft(newTimeLeft)
          updateBadge(newTimeLeft > 0 ? newTimeLeft : null)
          
          if (newTimeLeft === 0) {
            setIsRunning(false)
            setIsFinished(true)
            playSound()
            updateBadge(null)
            startTimeRef.current = null
            saveState({ duration: durationRef.current, timeLeft: 0, isRunning: false, isFinished: true, startTime: null })
            showTimerNotification()
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          } else {
            saveState({ duration: durationRef.current, timeLeft: newTimeLeft, isRunning: true, isFinished: false, startTime: startTimeRef.current })
          }
        }
      }

      updateTimer()
      intervalRef.current = setInterval(updateTimer, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (!isRunning && startTimeRef.current === null) {
        updateBadge(null)
        saveState({ duration: durationRef.current, timeLeft, isRunning: false, isFinished, startTime: null })
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  const saveState = (state: TimerState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
    }
  }

  const updateBadge = (seconds: number | null) => {
    if ('setAppBadge' in navigator && typeof navigator.setAppBadge === 'function') {
      if (seconds === null) {
        navigator.setAppBadge(0).catch(() => {})
      } else {
        const mins = Math.ceil(seconds / 60)
        navigator.setAppBadge(mins).catch(() => {})
      }
    }
  }

  const playSound = () => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)
    
    oscillator.frequency.value = 440
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)
    
    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.5)
  }

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration)
      setIsFinished(false)
      startTimeRef.current = Date.now()
    } else if (!startTimeRef.current) {
      startTimeRef.current = Date.now() - (durationRef.current - timeLeft) * 1000
    }
    setIsRunning(true)
    setIsOpen(true)
    updateBadge(timeLeft)
    saveState({ duration: durationRef.current, timeLeft, isRunning: true, isFinished: false, startTime: startTimeRef.current })
  }

  const handlePause = () => {
    setIsRunning(false)
    startTimeRef.current = null
    updateBadge(null)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(duration)
    setIsFinished(false)
    startTimeRef.current = null
    updateBadge(null)
    saveState({ duration, timeLeft: duration, isRunning: false, isFinished: false, startTime: null })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const presets = [30, 60, 90, 120, 180]

  // Minimized view (just timer)
  if (isOpen && isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="shadow-lg border-2 border-primary">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="text-center min-w-[80px]">
                <div className={`text-2xl font-bold ${isFinished ? 'text-green-500' : isRunning ? 'text-primary' : 'text-muted-foreground'}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="flex gap-1">
                {!isRunning ? (
                  <Button onClick={handleStart} size="sm" variant="outline">
                    <Play className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button onClick={handlePause} size="sm" variant="outline">
                    <Pause className="h-3 w-3" />
                  </Button>
                )}
                <Button onClick={handleReset} size="sm" variant="outline">
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button onClick={() => setIsMinimized(false)} size="sm" variant="outline">
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button onClick={() => setIsOpen(false)} size="sm" variant="ghost">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Full view
  if (isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80">
        <Card className="shadow-lg border-2 border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Timer className="h-5 w-5" />
                {t('title')}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Timer Display */}
            <div className="text-center">
              <div className={`text-5xl font-bold ${isFinished ? 'text-green-500' : isRunning ? 'text-primary' : 'text-muted-foreground'}`}>
                {formatTime(timeLeft)}
              </div>
              {isFinished && (
                <p className="text-green-500 font-medium mt-2 text-sm">{t('restComplete')}</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2">
              {!isRunning ? (
                <Button onClick={handleStart} size="lg" className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  {timeLeft === 0 ? t('restart') : t('start')}
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline" size="lg" className="flex-1">
                  <Pause className="h-4 w-4 mr-2" />
                  {t('pause')}
                </Button>
              )}
              <Button onClick={handleReset} variant="outline" size="lg">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset}
                  variant={duration === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDuration(preset)
                    setTimeLeft(preset)
                    setIsRunning(false)
                    setIsFinished(false)
                    startTimeRef.current = null
                    updateBadge(null)
                    saveState({ duration: preset, timeLeft: preset, isRunning: false, isFinished: false, startTime: null })
                  }}
                  disabled={isRunning}
                >
                  {preset}s
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="rounded-full shadow-lg h-14 w-14 p-0"
      >
        <Clock className="h-6 w-6 text-primary-foreground" />
      </Button>
    </div>
  )
}

