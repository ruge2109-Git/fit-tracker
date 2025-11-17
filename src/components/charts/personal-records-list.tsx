/**
 * Personal Records List Component
 * Displays user's personal records
 */

'use client'

import { Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatWeight } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface PersonalRecordsListProps {
  data: {
    exercise_name: string
    max_weight: number
    date: string
    reps: number
  }[]
}

export function PersonalRecordsList({ data }: PersonalRecordsListProps) {
  const t = useTranslations('profile')
  
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('personalRecords') || 'Personal Records'}
          </CardTitle>
          <CardDescription>{t('bestLiftsDescription') || 'Your best lifts for each exercise'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            {t('noRecordsYet') || 'No records yet. Start lifting!'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t('personalRecords') || 'Personal Records'}
        </CardTitle>
        <CardDescription>{t('bestLiftsTop5') || 'Your best lifts for each exercise (top 5)'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 5).map((record, index) => (
            <div
              key={record.exercise_name}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                  index === 1 ? 'bg-gray-400/20 text-gray-400' :
                  index === 2 ? 'bg-orange-500/20 text-orange-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <span className="text-sm font-bold">#{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium">{record.exercise_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatWeight(record.max_weight)}</p>
                <p className="text-xs text-muted-foreground">{record.reps} {t('reps')}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

