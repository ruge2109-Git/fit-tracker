/**
 * Personal Records List Component
 * Displays user's personal records
 */

'use client'

import { Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatWeight, cn } from '@/lib/utils'
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
    <Card className="rounded-[2.5rem] border-none shadow-lg overflow-hidden bg-accent/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t('personalRecords')}
        </CardTitle>
        <CardDescription className="text-xs font-medium">{t('bestLiftsTop5')}</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-4">
        <div className="space-y-2">
          {data.slice(0, 5).map((record, index) => (
            <div
              key={record.exercise_name}
              className="flex items-center justify-between p-4 bg-background/50 rounded-[2rem] hover:bg-background/80 transition-all active:scale-[0.98] cursor-default"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full shadow-sm font-black text-sm",
                  index === 0 ? 'bg-yellow-500 text-white shadow-yellow-500/20' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-400 text-white' :
                  'bg-accent text-muted-foreground'
                )}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight">{record.exercise_name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    {new Date(record.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-primary">{formatWeight(record.max_weight)}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{record.reps} {t('reps')}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

