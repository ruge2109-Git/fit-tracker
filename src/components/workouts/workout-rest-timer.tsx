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

export function WorkoutRestTimer() {
  const t = useTranslations('restTimer')
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [duration, setDuration] = useState(90)
  const [timeLeft, setTimeLeft] = useState(90)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved)
        if (state.isRunning && state.startTime) {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
          const newTimeLeft = Math.max(0, state.timeLeft - elapsed)
          setTimeLeft(newTimeLeft)
          setDuration(state.duration)
          setIsRunning(newTimeLeft > 0)
          setIsFinished(newTimeLeft === 0)
          if (newTimeLeft > 0) {
            startTimeRef.current = Date.now() - (state.timeLeft - newTimeLeft) * 1000
          }
        } else {
          setTimeLeft(state.timeLeft)
          setDuration(state.duration)
          setIsFinished(state.isFinished)
        }
      } catch (e) {
      }
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const newTimeLeft = Math.max(0, timeLeft - elapsed)
        setTimeLeft(newTimeLeft)
        if (newTimeLeft === 0) {
          setIsRunning(false)
          setIsFinished(true)
          playSound()
          updateBadge(null)
        } else {
          startTimeRef.current = Date.now() - (timeLeft - newTimeLeft) * 1000
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRunning, timeLeft])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      startTimeRef.current = Date.now() - (duration - timeLeft) * 1000
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        if (startTimeRef.current) {
          const elapsed = Math.floor((now - startTimeRef.current) / 1000)
          const newTimeLeft = Math.max(0, duration - elapsed)
          
          setTimeLeft(newTimeLeft)
          updateBadge(newTimeLeft > 0 ? newTimeLeft : null)
          
          if (newTimeLeft === 0) {
            setIsRunning(false)
            setIsFinished(true)
            playSound()
            updateBadge(null)
            saveState({ duration, timeLeft: 0, isRunning: false, isFinished: true, startTime: null })
          } else {
            saveState({ duration, timeLeft: newTimeLeft, isRunning: true, isFinished: false, startTime: startTimeRef.current })
          }
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (!isRunning) {
        updateBadge(null)
        saveState({ duration, timeLeft, isRunning: false, isFinished, startTime: null })
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, duration, isFinished])

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
      startTimeRef.current = null
    } else if (!startTimeRef.current) {
      startTimeRef.current = Date.now() - (duration - timeLeft) * 1000
    }
    setIsRunning(true)
    setIsOpen(true)
    updateBadge(timeLeft)
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

