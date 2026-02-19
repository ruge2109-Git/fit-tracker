/**
 * MeasurementChart Component
 * Displays body measurement evolution over time using Recharts
 */

'use client'

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { BodyMeasurement, Goal } from '@/types'
import { formatDate } from '@/lib/utils'
import { CHART_COLORS } from '@/lib/constants'
import { useTranslations } from 'next-intl'

interface MeasurementChartProps {
  measurements: BodyMeasurement[]
  goal?: Goal | null // Optional goal for comparison
  title?: string
}

export function MeasurementChart({ measurements, goal, title }: MeasurementChartProps) {
  const t = useTranslations('bodyMeasurements')
  
  const chartData = useMemo(() => {
    return measurements
      .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())
      .map((measurement) => ({
        date: formatDate(measurement.measurement_date, 'MMM dd'),
        fullDate: measurement.measurement_date,
        value: measurement.value,
        unit: measurement.unit,
      }))
  }, [measurements])

  if (measurements.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        {t('noData')}
      </div>
    )
  }

  const unit = measurements[0]?.unit || ''

  return (
    <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
              label={{ value: unit, angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 10 } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: 'none',
                borderRadius: '1.5rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
              }}
              itemStyle={{ fontSize: '12px', fontWeight: '800' }}
              labelStyle={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
              formatter={(value: number) => [`${value} ${unit}`, t('value')]}
              labelFormatter={(label) => `${label}`}
            />
            {goal && (
              <ReferenceLine
                y={goal.target_value}
                stroke={CHART_COLORS.secondary}
                strokeDasharray="5 5"
                label={{ value: `${t('goal')}: ${goal.target_value}`, position: 'top', fill: CHART_COLORS.secondary, fontSize: 10 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
    </div>
  )
}
