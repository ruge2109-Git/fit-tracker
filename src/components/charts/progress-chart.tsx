/**
 * ProgressChart Component
 * Displays exercise progress over time using Recharts
 */

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseProgress } from '@/types'
import { formatDate } from '@/lib/utils'
import { CHART_COLORS } from '@/lib/constants'
import { useTranslations } from 'next-intl'

interface ProgressChartProps {
  data: ExerciseProgress
  metric: 'weight' | 'reps' | 'volume'
  title?: string
}

export function ProgressChart({ data, metric, title }: ProgressChartProps) {
  const t = useTranslations('exercises')
  const tCharts = useTranslations('charts')
  
  const chartData = data.dates.map((date, index) => ({
    date: formatDate(date, 'MMM dd'),
    value: metric === 'weight' 
      ? data.weights[index] 
      : metric === 'reps' 
      ? data.reps[index] 
      : data.volume[index],
  }))

  const metricLabel = {
    weight: tCharts('weight'),
    reps: tCharts('repetitions'),
    volume: tCharts('volume'),
  }[metric]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || `${data.exercise_name} ${tCharts('progress')}`}</CardTitle>
        <CardDescription>{metricLabel} over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.primary, r: 4 }}
              name={metricLabel}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

