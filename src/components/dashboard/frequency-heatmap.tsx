'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function FrequencyHeatmap() {
  const { loading, error, frequencyHeatmap } = useAnalytics()

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
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">Error loading frequency data: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!frequencyHeatmap) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No frequency data available</p>
        </CardContent>
      </Card>
    )
  }

  const data = Object.entries(frequencyHeatmap).map(([day, count]) => ({
    day,
    workouts: count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Frequency by Day</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="workouts" fill="#3b82f6" name="Workouts" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Most active: <span className="font-semibold">
              {data.reduce((a, b) => (b.workouts > a.workouts ? b : a)).day}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
