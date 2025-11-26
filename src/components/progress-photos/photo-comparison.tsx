/**
 * PhotoComparison Component
 * Side-by-side comparison of progress photos
 */

'use client'

import { ProgressPhoto, PhotoType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useMemo } from 'react'
import { PhotoImage } from './photo-image'

interface PhotoComparisonProps {
  photos: ProgressPhoto[]
  photoType?: PhotoType
}

export function PhotoComparison({ photos, photoType }: PhotoComparisonProps) {
  const t = useTranslations('progressPhotos')
  const tCommon = useTranslations('common')
  const [selectedType, setSelectedType] = useState<PhotoType | 'all'>(photoType || 'all')
  const [photo1Id, setPhoto1Id] = useState<string>('')
  const [photo2Id, setPhoto2Id] = useState<string>('')

  // Filter photos by type
  const filteredPhotos = useMemo(() => {
    if (selectedType === 'all') return photos
    return photos.filter(p => p.photo_type === selectedType)
  }, [photos, selectedType])

  // Get unique photo types
  const photoTypes = useMemo(() => {
    const types = new Set(photos.map(p => p.photo_type))
    return Array.from(types)
  }, [photos])

  const getPhotoTypeLabel = (type: PhotoType) => {
    const typeMap: Record<PhotoType, string> = {
      [PhotoType.FRONT]: t('types.front'),
      [PhotoType.SIDE]: t('types.side'),
      [PhotoType.BACK]: t('types.back'),
      [PhotoType.CUSTOM]: t('types.custom'),
    }
    return typeMap[type] || type
  }

  const photo1 = filteredPhotos.find(p => p.id === photo1Id)
  const photo2 = filteredPhotos.find(p => p.id === photo2Id)

  if (filteredPhotos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('noPhotosForComparison') || 'No photos available for comparison'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filters */}
      <div className="flex gap-2 sm:gap-4 flex-wrap">
        <div className="flex-1 min-w-full sm:min-w-[200px]">
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as PhotoType | 'all')}>
            <SelectTrigger className="h-9 sm:h-10">
              <SelectValue placeholder={t('selectPhotoType') || 'Select photo type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTypes') || 'All Types'}</SelectItem>
              {photoTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getPhotoTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Photo Selection */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">{t('photo1') || 'Photo 1'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Select value={photo1Id} onValueChange={setPhoto1Id}>
              <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder={t('selectPhoto') || 'Select photo'} />
              </SelectTrigger>
              <SelectContent>
                {filteredPhotos.map((photo) => (
                  <SelectItem key={photo.id} value={photo.id}>
                    {formatDate(photo.photo_date, 'PP')} - {getPhotoTypeLabel(photo.photo_type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {photo1 ? (
              <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border max-h-[60vh] sm:max-h-none">
                <PhotoImage
                  photoUrl={photo1.photo_url}
                  alt={getPhotoTypeLabel(photo1.photo_type)}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-3">
                  <p className="text-white text-xs sm:text-sm font-medium">
                    {formatDate(photo1.photo_date, 'PP')}
                  </p>
                  {photo1.notes && (
                    <p className="text-white/80 text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-2">{photo1.notes}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-[3/4] w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center p-4">
                <p className="text-muted-foreground text-xs sm:text-sm text-center">{t('selectPhotoToCompare') || 'Select a photo to compare'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">{t('photo2') || 'Photo 2'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Select value={photo2Id} onValueChange={setPhoto2Id}>
              <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder={t('selectPhoto') || 'Select photo'} />
              </SelectTrigger>
              <SelectContent>
                {filteredPhotos.map((photo) => (
                  <SelectItem key={photo.id} value={photo.id}>
                    {formatDate(photo.photo_date, 'PP')} - {getPhotoTypeLabel(photo.photo_type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {photo2 ? (
              <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border max-h-[60vh] sm:max-h-none">
                <PhotoImage
                  photoUrl={photo2.photo_url}
                  alt={getPhotoTypeLabel(photo2.photo_type)}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-3">
                  <p className="text-white text-xs sm:text-sm font-medium">
                    {formatDate(photo2.photo_date, 'PP')}
                  </p>
                  {photo2.notes && (
                    <p className="text-white/80 text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-2">{photo2.notes}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-[3/4] w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center p-4">
                <p className="text-muted-foreground text-xs sm:text-sm text-center">{t('selectPhotoToCompare') || 'Select a photo to compare'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Info */}
      {photo1 && photo2 && (
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 text-xs sm:text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs sm:text-sm">{t('timeDifference') || 'Time Difference'}</p>
                <p className="font-medium text-sm sm:text-base">
                  {Math.abs(
                    Math.floor(
                      (new Date(photo2.photo_date).getTime() - new Date(photo1.photo_date).getTime()) /
                      (1000 * 60 * 60 * 24)
                    )
                  )}{' '}
                  {t('days') || 'days'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs sm:text-sm">{t('photoType')}</p>
                <p className="font-medium text-sm sm:text-base break-words">
                  {getPhotoTypeLabel(photo1.photo_type)} → {getPhotoTypeLabel(photo2.photo_type)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

