'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  subWeeks, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  format,
  isAfter
} from 'date-fns'
import { es } from 'date-fns/locale'
import { statsService } from '@/domain/services/stats.service'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Metrics {
  volume: number
  workouts: number
  avgDuration: number
}

interface PeriodComparisonProps {
  userId: string
}

type PeriodType = 'week' | 'month'

export function PeriodComparison({ userId }: PeriodComparisonProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('week')
  const [currentMetrics, setCurrentMetrics] = useState<Metrics | null>(null)
  const [previousMetrics, setPreviousMetrics] = useState<Metrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadComparisonData()
  }, [userId, periodType])

  const loadComparisonData = async () => {
    setIsLoading(true)
    const now = new Date()
    
    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date

    if (periodType === 'week') {
      currentStart = startOfWeek(now, { weekStartsOn: 1 })
      currentEnd = endOfWeek(now, { weekStartsOn: 1 })
      prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    } else {
      currentStart = startOfMonth(now)
      currentEnd = endOfMonth(now)
      prevStart = startOfMonth(subMonths(now, 1))
      prevEnd = endOfMonth(subMonths(now, 1))
    }

    const [currentRes, prevRes] = await Promise.all([
      statsService.getPeriodMetrics(userId, format(currentStart, 'yyyy-MM-dd'), format(currentEnd, 'yyyy-MM-dd')),
      statsService.getPeriodMetrics(userId, format(prevStart, 'yyyy-MM-dd'), format(prevEnd, 'yyyy-MM-dd'))
    ])

    if (currentRes.data) setCurrentMetrics(currentRes.data)
    if (prevRes.data) setPreviousMetrics(prevRes.data)
    setIsLoading(false)
  }

  const calculateDiff = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0
    return ((curr - prev) / prev) * 100
  }

  const renderMetric = (label: string, curr: number, prev: number, unit: string = '') => {
    const diff = calculateDiff(curr, prev)
    const isPositive = diff > 0
    const isNeutral = Math.abs(diff) < 1

    return (
      <div className="flex flex-col gap-1 p-3 bg-accent/20 rounded-2xl">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</span>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black">{curr.toLocaleString()}</span>
            {unit && <span className="text-[10px] font-bold text-muted-foreground uppercase">{unit}</span>}
          </div>
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            isNeutral ? "bg-muted text-muted-foreground" : isPositive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          )}>
            {isNeutral ? <Minus className="h-3 w-3" /> : isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isNeutral ? '0%' : `${Math.abs(Math.round(diff))}%`}
          </div>
        </div>
        <div className="text-[9px] text-muted-foreground font-medium">
          Anterior: {prev.toLocaleString()} {unit}
        </div>
      </div>
    )
  }

  return (
    <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-bold">Comparativa</CardTitle>
          <CardDescription className="text-xs">Rendimiento vs periodo anterior</CardDescription>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-xl">
          <Button 
            variant={periodType === 'week' ? 'default' : 'ghost'} 
            size="sm" 
            className="h-7 text-[10px] font-bold rounded-lg px-3"
            onClick={() => setPeriodType('week')}
          >
            Semana
          </Button>
          <Button 
            variant={periodType === 'month' ? 'default' : 'ghost'} 
            size="sm" 
            className="h-7 text-[10px] font-bold rounded-lg px-3"
            onClick={() => setPeriodType('month')}
          >
            Mes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : currentMetrics && previousMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {renderMetric('Volumen Total', currentMetrics.volume, previousMetrics.volume, 'kg')}
            {renderMetric('Frecuencia', currentMetrics.workouts, previousMetrics.workouts, 'ent.')}
            {renderMetric('Duración Promedio', currentMetrics.avgDuration, previousMetrics.avgDuration, 'min')}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2 opacity-50">
            <Info className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Insuficientes datos para comparar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
