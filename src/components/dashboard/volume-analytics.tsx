'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Loader2 } from 'lucide-react'
import { MuscleGroup } from '@/types'

const COLORS = {
  [MuscleGroup.CHEST]: '#ef4444',
  [MuscleGroup.BACK]: '#3b82f6',
  [MuscleGroup.LEGS]: '#8b5cf6',
  [MuscleGroup.SHOULDERS]: '#f59e0b',
  [MuscleGroup.ARMS]: '#10b981',
  [MuscleGroup.CORE]: '#ec4899',
  [MuscleGroup.FULL_BODY]: '#6366f1',
  [MuscleGroup.CARDIO]: '#14b8a6',
}

export function VolumeAnalytics() {
  const { loading, error, volumeMetrics, muscleBalance, weeklyTrend } = useAnalytics()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">Error loading analytics: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!volumeMetrics || !muscleBalance || !weeklyTrend) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No workout data available</p>
        </CardContent>
      </Card>
    )
  }

  const pieData = muscleBalance.map((m) => ({
    name: m.muscleGroup,
    value: Math.round(m.tonnage * 10) / 10,
  }))

  return (
    <div className="space-y-6">
      {/* Volume Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tonnage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{volumeMetrics.totalTonnage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">kg total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{volumeMetrics.totalSets}</div>
            <p className="text-xs text-muted-foreground mt-1">sets completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Weight/Set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{volumeMetrics.averageWeightPerSet}</div>
            <p className="text-xs text-muted-foreground mt-1">kg per set</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{volumeMetrics.totalReps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">reps total</p>
          </CardContent>
        </Card>
      </div>

      {/* Muscle Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Muscle Group Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${((entry.value / volumeMetrics.totalTonnage) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as MuscleGroup]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          {/* Detailed breakdown */}
          <div className="mt-6 space-y-2">
            {muscleBalance
              .sort((a, b) => b.tonnage - a.tonnage)
              .map((muscle) => (
                <div key={muscle.muscleGroup} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{muscle.muscleGroup}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full w-32 bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${muscle.percentage}%`,
                          backgroundColor: COLORS[muscle.muscleGroup],
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs min-w-12">
                      {muscle.tonnage} kg ({muscle.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Tonnage Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tonnage" fill="#8b5cf6" name="Tonnage (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
