/**
 * Muscle Group Distribution Chart
 * Pie chart showing muscle group distribution
 */

'use client'

import { memo, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
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

export const MuscleGroupChart = memo(function MuscleGroupChart({ data }: MuscleGroupChartProps) {
  const t = useTranslations('dashboard')
  const tCharts = useTranslations('charts')
  
  const MUSCLE_GROUP_LABELS: Record<string, string> = useMemo(() => ({
    chest: tCharts('muscleGroups.chest'),
    back: tCharts('muscleGroups.back'),
    legs: tCharts('muscleGroups.legs'),
    shoulders: tCharts('muscleGroups.shoulders'),
    arms: tCharts('muscleGroups.arms'),
    core: tCharts('muscleGroups.core'),
    full_body: tCharts('muscleGroups.fullBody'),
    cardio: tCharts('muscleGroups.cardio'),
  }), [tCharts])

  const chartData = useMemo(() => Object.entries(data).map(([key, value]) => ({
    name: MUSCLE_GROUP_LABELS[key] || key,
    value,
  })).filter(item => item.value > 0), [data, MUSCLE_GROUP_LABELS])

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
    <Card className="rounded-[2.5rem] border-none shadow-lg overflow-hidden bg-accent/10">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          {t('muscleGroupDistribution')}
        </CardTitle>
        <CardDescription className="text-xs font-medium">
          {t('distributionOfSets')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="transparent"
                  className="hover:opacity-80 transition-opacity outline-none"
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: 'none',
                borderRadius: '1.5rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

