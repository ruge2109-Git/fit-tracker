/**
 * Muscle Group Distribution Chart
 * Pie chart showing muscle group distribution
 */

'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface MuscleGroupChartProps {
  data: Record<string, number>
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
]

export function MuscleGroupChart({ data }: MuscleGroupChartProps) {
  const t = useTranslations('dashboard')
  const tCharts = useTranslations('charts')
  
  const MUSCLE_GROUP_LABELS: Record<string, string> = {
    chest: tCharts('muscleGroups.chest'),
    back: tCharts('muscleGroups.back'),
    legs: tCharts('muscleGroups.legs'),
    shoulders: tCharts('muscleGroups.shoulders'),
    arms: tCharts('muscleGroups.arms'),
    core: tCharts('muscleGroups.core'),
    full_body: tCharts('muscleGroups.fullBody'),
    cardio: tCharts('muscleGroups.cardio'),
  }

  const chartData = Object.entries(data).map(([key, value]) => ({
    name: MUSCLE_GROUP_LABELS[key] || key,
    value,
  })).filter(item => item.value > 0)

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('muscleGroupDistribution')}</CardTitle>
          <CardDescription>{t('seeWhichMuscles')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t('noDataYet')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('muscleGroupDistribution')}</CardTitle>
        <CardDescription>{t('distributionOfSets')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

