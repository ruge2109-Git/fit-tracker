/**
 * MeasurementChart Component
 * Displays body measurement evolution over time using Recharts
 */

'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  const tCharts = useTranslations('charts')

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
      <Card>
        <CardHeader>
          <CardTitle>{title || t('evolution')}</CardTitle>
          <CardDescription>{t('noMeasurementsYet')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t('noData')}
          </div>
        </CardContent>
      </Card>
    )
  }

  const unit = measurements[0]?.unit || ''
  const measurementType = measurements[0]?.measurement_type || ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || t('evolution')}</CardTitle>
        <CardDescription>
          {t('evolutionDescription')} {goal && `(${t('goal')}: ${goal.target_value} ${goal.unit})`}
        </CardDescription>
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
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: unit, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number) => [`${value} ${unit}`, t('value')]}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            {goal && (
              <ReferenceLine
                y={goal.target_value}
                stroke={CHART_COLORS.secondary}
                strokeDasharray="5 5"
                label={{ value: `${t('goal')}: ${goal.target_value} ${goal.unit}`, position: 'top' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.primary, r: 4 }}
              name={t('value')}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

