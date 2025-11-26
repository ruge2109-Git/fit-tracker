/**
 * MeasurementCard Component
 * Displays a single body measurement entry
 */

'use client'

import { Calendar, Edit, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BodyMeasurement, MeasurementType } from '@/types'
import { formatDate } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface MeasurementCardProps {
  measurement: BodyMeasurement
  previousMeasurement?: BodyMeasurement | null
  onEdit?: () => void
  onDelete?: () => void
}

export function MeasurementCard({ measurement, previousMeasurement, onEdit, onDelete }: MeasurementCardProps) {
  const t = useTranslations('bodyMeasurements')
  const tCommon = useTranslations('common')

  const getMeasurementTypeLabel = (type: MeasurementType) => {
    const typeMap: Record<MeasurementType, string> = {
      [MeasurementType.WEIGHT]: t('types.weight'),
      [MeasurementType.BODY_FAT]: t('types.bodyFat'),
      [MeasurementType.CHEST]: t('types.chest'),
      [MeasurementType.WAIST]: t('types.waist'),
      [MeasurementType.HIPS]: t('types.hips'),
      [MeasurementType.BICEPS]: t('types.biceps'),
      [MeasurementType.THIGHS]: t('types.thighs'),
      [MeasurementType.NECK]: t('types.neck'),
      [MeasurementType.SHOULDERS]: t('types.shoulders'),
      [MeasurementType.FOREARMS]: t('types.forearms'),
      [MeasurementType.CALVES]: t('types.calves'),
      [MeasurementType.CUSTOM]: t('types.custom'),
    }
    return typeMap[type] || type
  }

  const getTrend = () => {
    if (!previousMeasurement) return null
    const diff = measurement.value - previousMeasurement.value
    if (diff > 0) return { icon: TrendingUp, color: 'text-red-500', label: `+${diff.toFixed(2)}` }
    if (diff < 0) return { icon: TrendingDown, color: 'text-green-500', label: `${diff.toFixed(2)}` }
    return { icon: Minus, color: 'text-muted-foreground', label: '0' }
  }

  const trend = getTrend()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {getMeasurementTypeLabel(measurement.measurement_type)}
              {trend && (
                <Badge variant="outline" className={trend.color}>
                  <trend.icon className="h-3 w-3 mr-1" />
                  {trend.label} {measurement.unit}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(measurement.measurement_date, 'PP')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{measurement.value}</span>
            <span className="text-muted-foreground">{measurement.unit}</span>
          </div>
          {measurement.notes && (
            <p className="text-sm text-muted-foreground mt-2">{measurement.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

