/**
 * PhotoGallery Component
 * Displays a gallery of progress photos with dates
 */

'use client'

import { ProgressPhoto, PhotoType } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { Calendar, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PhotoImage } from './photo-image'

interface PhotoGalleryProps {
  photos: ProgressPhoto[]
  onDelete?: (id: string) => void
  onEdit?: (photo: ProgressPhoto) => void
  groupByDate?: boolean
}

export function PhotoGallery({ photos, onDelete, onEdit, groupByDate = true }: PhotoGalleryProps) {
  const t = useTranslations('progressPhotos')
  const tCommon = useTranslations('common')
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)

  const getPhotoTypeLabel = (type: PhotoType) => {
    const typeMap: Record<PhotoType, string> = {
      [PhotoType.FRONT]: t('types.front'),
      [PhotoType.SIDE]: t('types.side'),
      [PhotoType.BACK]: t('types.back'),
      [PhotoType.CUSTOM]: t('types.custom'),
    }
    return typeMap[type] || type
  }

  // Sort photos by photo_date (descending) first, then group by date if requested
  const sortedPhotos = [...photos].sort((a, b) => {
    // Primary sort: photo_date descending (most recent first)
    const dateCompare = b.photo_date.localeCompare(a.photo_date)
    if (dateCompare !== 0) return dateCompare
    // Secondary sort: created_at descending (most recent first) as tiebreaker
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Group photos by date if requested
  const groupedPhotos = groupByDate
    ? sortedPhotos.reduce((acc, photo) => {
        const date = photo.photo_date
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(photo)
        return acc
      }, {} as Record<string, ProgressPhoto[]>)
    : { 'All': sortedPhotos }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('noPhotos') || 'No photos yet'}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(groupedPhotos)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
          .map(([date, datePhotos]) => (
            <div key={date} className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 text-sm sm:text-base font-semibold border-b border-border pb-2 mb-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formatDate(date, 'PP')}</span>
                <span className="text-xs text-muted-foreground font-normal">({datePhotos.length} {t('photos') || 'photos'})</span>
              </div>
              <div className="grid gap-2 sm:gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {datePhotos
                  .sort((a, b) => {
                    // Within the same date group, all photos have the same photo_date
                    // Sort by created_at descending (most recent first) as tiebreaker
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  })
                  .map((photo, index) => (
                  <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="relative aspect-square w-full">
                      <PhotoImage
                        photoUrl={photo.photo_url}
                        alt={getPhotoTypeLabel(photo.photo_type)}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 12.5vw"
                        className="object-cover cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                        priority={index < 6} // Priority for first 6 images (above the fold)
                      />
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 bg-background/90 backdrop-blur-sm hover:bg-background"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(photo)
                            }}
                          >
                            <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 bg-background/90 backdrop-blur-sm hover:bg-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this photo?')) {
                                onDelete(photo.id)
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 sm:p-2">
                        <p className="text-white text-xs font-medium truncate">
                          {getPhotoTypeLabel(photo.photo_type)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPhoto && getPhotoTypeLabel(selectedPhoto.photo_type)}
            </DialogTitle>
            <DialogDescription>
              {selectedPhoto && formatDate(selectedPhoto.photo_date, 'PP')}
            </DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative aspect-[3/4] w-full max-h-[80vh]">
              <PhotoImage
                photoUrl={selectedPhoto.photo_url}
                alt={getPhotoTypeLabel(selectedPhoto.photo_type)}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-contain"
              />
            </div>
          )}
          {selectedPhoto?.notes && (
            <p className="text-sm text-muted-foreground mt-4">{selectedPhoto.notes}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

