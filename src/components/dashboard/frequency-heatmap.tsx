'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslations } from 'next-intl'

export function FrequencyHeatmap() {
  const { loading, error, frequencyHeatmap } = useAnalytics()
  const t = useTranslations('dashboard.frequencyHeatmap')

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-3xl border-none shadow-lg overflow-hidden bg-red-50/50">
        <CardContent className="pt-6">
          <p className="text-red-700 text-sm">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!frequencyHeatmap) {
    return (
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-accent/10">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Loader2 className="h-8 w-8 text-muted-foreground/40 mb-3 stroke-[1.5px]" />
          <p className="text-xs text-muted-foreground">No frequency data available</p>
        </CardContent>
      </Card>
    )
  }

  const data = Object.entries(frequencyHeatmap).map(([day, count]) => ({
    day,
    workouts: count,
  }))

  return (
    <Card className="rounded-3xl border-none shadow-lg overflow-hidden bg-accent/10">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="workouts" fill="#3b82f6" name={t('workouts')} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            {t('mostActive')}: <span className="font-semibold">
              {data.reduce((a, b) => (b.workouts > a.workouts ? b : a)).day}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
