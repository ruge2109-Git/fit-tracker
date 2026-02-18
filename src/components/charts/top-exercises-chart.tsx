/**
 * Top Exercises Chart
 * Bar chart showing most frequently performed exercises
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface TopExercisesChartProps {
  data: {
    exercise_name: string
    count: number
    muscle_group: string
  }[]
}

import { BarChart as BarChartIcon, Dumbbell } from 'lucide-react'

export function TopExercisesChart({ data }: TopExercisesChartProps) {
  const t = useTranslations('dashboard')
  const tCharts = useTranslations('charts')
  
  if (data.length === 0) {
    return (
      <Card className="rounded-[2.5rem] border-none shadow-lg overflow-hidden bg-accent/10">
        <CardHeader>
          <CardTitle className="text-lg">{t('topExercises')}</CardTitle>
          <CardDescription className="text-xs">{t('mostFrequentlyPerformed')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
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
          <Dumbbell className="h-5 w-5 text-primary" />
          {t('topExercises')}
        </CardTitle>
        <CardDescription className="text-xs font-medium">
          {t('mostFrequentlyPerformedBySets')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category"
              dataKey="exercise_name" 
              axisLine={false}
              tickLine={false}
              width={100}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 800 }}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: 'none',
                borderRadius: '1.5rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))" 
              radius={[20, 20, 20, 20]}
              barSize={12}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

