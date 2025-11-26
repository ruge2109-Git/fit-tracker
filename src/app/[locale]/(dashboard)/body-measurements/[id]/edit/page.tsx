/**
 * Edit Body Measurement Page
 * Edit an existing body measurement
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MeasurementForm } from '@/components/body-measurements/measurement-form'
import { useBodyMeasurementStore } from '@/store/body-measurement.store'
import { bodyMeasurementService } from '@/domain/services/body-measurement.service'
import { BodyMeasurement, BodyMeasurementFormData } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useSafeLoading } from '@/hooks/use-safe-async'
import { useAuthStore } from '@/store/auth.store'
import { logger } from '@/lib/logger'

export default function EditBodyMeasurementPage() {
  const params = useParams()
  const router = useNavigationRouter()
  const measurementId = params.id as string
  const { user } = useAuthStore()
  const { updateMeasurement, isLoading } = useBodyMeasurementStore()
  const t = useTranslations('bodyMeasurements')
  const tCommon = useTranslations('common')
  const { isLoading: isSafeLoading, setLoading } = useSafeLoading()
  const [measurement, setMeasurement] = useState<BodyMeasurement | null>(null)
  const [isLoadingMeasurement, setIsLoadingMeasurement] = useState(true)

  useEffect(() => {
    loadMeasurementData()
  }, [measurementId])

  const loadMeasurementData = async () => {
    setIsLoadingMeasurement(true)
    try {
      const result = await bodyMeasurementService.getMeasurement(measurementId)
      if (result.data) {
        setMeasurement(result.data)
      } else {
        toast.error(t('failedToLoad') || 'Failed to load measurement')
        router.push(ROUTES.BODY_MEASUREMENTS)
      }
    } catch (error) {
      logger.error('Error loading measurement', error as Error, 'EditBodyMeasurementPage')
      toast.error(t('failedToLoad') || 'Failed to load measurement')
      router.push(ROUTES.BODY_MEASUREMENTS)
    } finally {
      setIsLoadingMeasurement(false)
    }
  }

  const handleUpdate = async (data: BodyMeasurementFormData) => {
    if (!measurement) return

    setLoading(true)
    try {
      const success = await updateMeasurement(measurement.id, data)
      if (success) {
        toast.success(t('measurementUpdated') || 'Measurement updated successfully!')
        router.push(ROUTES.BODY_MEASUREMENTS)
      } else {
        toast.error(t('errorUpdatingMeasurement') || 'Failed to update measurement')
      }
    } catch (error) {
      toast.error(t('errorUpdatingMeasurement') || 'Failed to update measurement')
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingMeasurement || !measurement) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.BODY_MEASUREMENTS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('editMeasurement')}</h1>
          <p className="text-muted-foreground">{t('editMeasurementDescription')}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('measurementDetails') || 'Measurement Details'}</CardTitle>
          <CardDescription>{t('updateMeasurementInformation') || 'Update the information below'}</CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementForm
            onSubmit={handleUpdate}
            defaultValues={measurement}
            isLoading={isLoading || isSafeLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

