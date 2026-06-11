'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function StrengthProgression() {
  const { loading, error, oneRepMaxProgression } = useAnalytics()
  const t = useTranslations('dashboard.strengthProgression')

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

  if (!oneRepMaxProgression || oneRepMaxProgression.length === 0) {
    return (
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-accent/10">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-3 stroke-[1.5px]" />
          <p className="text-xs text-muted-foreground">{t('noData')}</p>
        </CardContent>
      </Card>
    )
  }

  const sorted = oneRepMaxProgression.sort((a, b) => b.estimatedOneRM - a.estimatedOneRM)

  return (
    <Card className="rounded-3xl border-none shadow-lg overflow-hidden bg-accent/10">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {sorted.map((exercise) => (
            <div key={exercise.exercise} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{exercise.exercise}</h4>
                <p className="text-sm text-muted-foreground">{t('estimatedOneRM', { weight: exercise.estimatedOneRM })}</p>
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
