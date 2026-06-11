'use client'

import { useRecommendations } from '@/hooks/useRecommendations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Lightbulb, TrendingUp, Zap, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const iconMap = {
  missing_muscle: <AlertCircle className="w-5 h-5" />,
  strength_progression: <TrendingUp className="w-5 h-5" />,
  frequency: <Zap className="w-5 h-5" />,
  balance: <Lightbulb className="w-5 h-5" />,
}

const colorMap = {
  high: 'bg-red-50 border-red-200',
  medium: 'bg-yellow-50 border-yellow-200',
  low: 'bg-blue-50 border-blue-200',
}

const badgeColorMap = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
}

export function RecommendationsCard() {
  const { loading, error, recommendations } = useRecommendations()

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
          <p className="text-red-700">Error loading recommendations: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Keep training consistently and we'll have more personalized recommendations!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Personalized Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div key={idx} className={`p-4 rounded-lg border ${colorMap[rec.priority]}`}>
            <div className="flex items-start gap-3">
              <div className="text-muted-foreground mt-0.5">
                {iconMap[rec.type] || <Lightbulb className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{rec.title}</h4>
                  <Badge className={badgeColorMap[rec.priority]} variant="outline">
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                {rec.suggestedExercises && rec.suggestedExercises.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rec.suggestedExercises.slice(0, 3).map((exercise) => (
                      <Badge key={exercise} variant="secondary" className="text-xs">
                        {exercise}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
