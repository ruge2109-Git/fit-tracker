'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'

export function StrengthProgression() {
  const { loading, error, oneRepMaxProgression } = useAnalytics()

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
          <p className="text-red-700">Error loading strength data: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!oneRepMaxProgression || oneRepMaxProgression.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No strength data available yet</p>
        </CardContent>
      </Card>
    )
  }

  const sorted = oneRepMaxProgression.sort((a, b) => b.estimatedOneRM - a.estimatedOneRM)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Strength Progression
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((exercise) => (
            <div key={exercise.exercise} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{exercise.exercise}</h4>
                <p className="text-sm text-muted-foreground">Estimated 1RM: {exercise.estimatedOneRM} kg</p>
              </div>
              <div className="flex items-center gap-2">
                {exercise.progression > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">+{exercise.progression.toFixed(1)}%</span>
                  </>
                ) : exercise.progression < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-600">{exercise.progression.toFixed(1)}%</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
