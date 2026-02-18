/**
 * Volume Chart Component
 * Displays weekly volume progression
 */

'use client'

import { memo, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface VolumeChartProps {
  data: {
    week: string
    volume: number
    workouts: number
  }[]
}

export const VolumeChart = memo(function VolumeChart({ data }: VolumeChartProps) {
  const t = useTranslations('dashboard')
  const tCharts = useTranslations('charts')
  
  const formattedData = useMemo(() => data.map(item => ({
    ...item,
    week: new Date(item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })), [data])

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('weeklyVolume')}</CardTitle>
          <CardDescription>{t('trackTotalVolume')}</CardDescription>
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
          <TrendingUp className="h-5 w-5 text-primary" />
          {t('weeklyVolume')}
        </CardTitle>
        <CardDescription className="text-xs font-medium">
          {t('trackTotalVolume')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
            <XAxis 
              dataKey="week" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 600 }}
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
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="hsl(var(--primary))" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorVolume)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

