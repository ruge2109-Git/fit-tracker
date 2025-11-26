/**
 * PhotoUpload Component
 * Form for uploading progress photos
 * Using React Hook Form + Zod for validation
 */

'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProgressPhotoFormData, PhotoType } from '@/types'
import { useTranslations } from 'next-intl'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'

interface PhotoUploadProps {
  onSubmit: (data: ProgressPhotoFormData) => void
  isLoading?: boolean
}

// Use a more flexible validation that works in both SSR and client
const photoUploadSchema = z.object({
  photo: z.any()
    .refine((file) => file instanceof File, 'Photo is required')
    .refine((file) => file instanceof File && file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => file instanceof File && ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
  photo_type: z.nativeEnum(PhotoType),
  notes: z.string().optional(),
  photo_date: z.string().min(1, 'Date is required'),
})

export function PhotoUpload({ onSubmit, isLoading }: PhotoUploadProps) {
  const t = useTranslations('progressPhotos')
  const tCommon = useTranslations('common')
  const [preview, setPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ProgressPhotoFormData>({
    resolver: zodResolver(photoUploadSchema),
    defaultValues: {
      photo_type: PhotoType.FRONT,
      notes: '',
      photo_date: new Date().toISOString().split('T')[0],
    },
  })

  const selectedPhoto = watch('photo')

  // Handle file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('photo', file, { shouldValidate: true })
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setValue('photo', undefined as any, { shouldValidate: false })
    setPreview(null)
  }

  const photoTypeOptions = [
    { value: PhotoType.FRONT, label: t('types.front') },
    { value: PhotoType.SIDE, label: t('types.side') },
    { value: PhotoType.BACK, label: t('types.back') },
    { value: PhotoType.CUSTOM, label: t('types.custom') },
  ]

  const normalizeFormData = (data: ProgressPhotoFormData): ProgressPhotoFormData => {
    return {
      ...data,
      notes: data.notes?.trim() || undefined,
    }
  }

  const onSubmitForm = (data: ProgressPhotoFormData) => {
    const normalized = normalizeFormData(data)
    onSubmit(normalized)
    reset()
    setPreview(null)
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      {/* Photo Upload */}
      <div className="space-y-2">
        <Label htmlFor="photo">{t('photo')}</Label>
        {!preview ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Input
              id="photo"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              {...register('photo', {
                onChange: handleFileChange,
              })}
              className="hidden"
            />
            <Label
              htmlFor="photo"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('clickToUpload') || 'Click to upload photo'}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('maxFileSize') || 'Max file size: 5MB'}
              </span>
            </Label>
          </div>
        ) : (
          <div className="relative">
            <div className="relative w-full h-64 rounded-lg overflow-hidden border">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemovePhoto}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {errors.photo && (
          <p className="text-sm text-destructive">{errors.photo.message}</p>
        )}
      </div>

      {/* Photo Type */}
      <div className="space-y-2">
        <Label htmlFor="photo_type">{t('photoType')}</Label>
        <Controller
          name="photo_type"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectPhotoType') || 'Select photo type'} />
              </SelectTrigger>
              <SelectContent>
                {photoTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.photo_type && (
          <p className="text-sm text-destructive">{errors.photo_type.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="photo_date">{tCommon('date')}</Label>
        <Input
          id="photo_date"
          type="date"
          {...register('photo_date')}
          disabled={isLoading}
        />
        {errors.photo_date && (
          <p className="text-sm text-destructive">{errors.photo_date.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          {tCommon('notes')} ({tCommon('optional')})
        </Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder={t('notesPlaceholder') || 'Add any notes about this photo...'}
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading || !selectedPhoto}>
        {isLoading ? tCommon('uploading') || 'Uploading...' : t('uploadPhoto') || 'Upload Photo'}
      </Button>
    </form>
  )
}

