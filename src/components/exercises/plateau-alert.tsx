'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Lightbulb, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlateauAlertProps {
  exerciseId: string
}

export function PlateauAlert({ exerciseId }: PlateauAlertProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkPlateau()
  }, [exerciseId])

  const checkPlateau = async () => {
    try {
      const response = await fetch('/api/ai/plateau-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId }),
      })
      const result = await response.json()
      if (result.stalled) {
        setData(result)
      }
    } catch (error) {
      console.error('Plateau check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-dashed border-accent/40 bg-accent/5 animate-pulse">
        <CardContent className="h-24 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card className="rounded-3xl border-none bg-amber-500/10 dark:bg-amber-500/5 overflow-hidden mb-6 border border-amber-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/20 p-1.5 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Detección de Estancamiento
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground italic">
            "{data.analysis}"
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Lightbulb className="h-3 w-3" /> Sugerencias de la IA
          </div>
          <div className="grid grid-cols-1 gap-2">
            {data.suggestions.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs bg-background/50 p-2 rounded-xl border border-accent/10">
                <span className="flex-shrink-0 h-4 w-4 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-[10px]">
                  {i + 1}
                </span>
                <span className="font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
