/**
 * Progress Photos Page
 * Displays all user progress photos with gallery and comparison features
 */

'use client'

import { useEffect, useState } from 'react'
import { Plus, Camera, Grid3x3, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PhotoUpload } from '@/components/progress-photos/photo-upload'
import { PhotoGallery } from '@/components/progress-photos/photo-gallery'
import { PhotoComparison } from '@/components/progress-photos/photo-comparison'
import { PhotoImage } from '@/components/progress-photos/photo-image'
import { useAuthStore } from '@/store/auth.store'
import { useProgressPhotoStore } from '@/store/progress-photo.store'
import { ProgressPhoto, ProgressPhotoFormData } from '@/types'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useSafeLoading } from '@/hooks/use-safe-async'

export default function ProgressPhotosPage() {
  const { user } = useAuthStore()
  const { photos, loadPhotos, createPhoto, updatePhoto, deletePhoto, isLoading } = useProgressPhotoStore()
  const t = useTranslations('progressPhotos')
  const tCommon = useTranslations('common')
  const { isLoading: isSafeLoading, setLoading } = useSafeLoading()
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<ProgressPhoto | null>(null)
  const [activeTab, setActiveTab] = useState<'gallery' | 'comparison'>('gallery')

  useEffect(() => {
    if (user) {
      loadPhotos(user.id)
    }
  }, [user, loadPhotos])

  const handleCreatePhoto = async (data: ProgressPhotoFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const photoId = await createPhoto(user.id, data)
      if (photoId) {
        toast.success(t('photoUploaded') || 'Photo uploaded successfully!')
        setCreateDialogOpen(false)
        await loadPhotos(user.id)
      } else {
        toast.error(t('errorUploadingPhoto') || 'Failed to upload photo')
      }
    } catch (error) {
      toast.error(t('errorUploadingPhoto') || 'Failed to upload photo')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePhoto = async (photo: ProgressPhoto, data: Partial<ProgressPhoto>) => {
    setLoading(true)
    try {
      const success = await updatePhoto(photo.id, data)
      if (success) {
        toast.success(t('photoUpdated') || 'Photo updated successfully!')
        setEditingPhoto(null)
        if (user) {
          await loadPhotos(user.id)
        }
      } else {
        toast.error(t('errorUpdatingPhoto') || 'Failed to update photo')
      }
    } catch (error) {
      toast.error(t('errorUpdatingPhoto') || 'Failed to update photo')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePhoto = async (id: string) => {
    setLoading(true)
    try {
      const success = await deletePhoto(id)
      if (success) {
        toast.success(t('photoDeleted') || 'Photo deleted successfully!')
        if (user) {
          await loadPhotos(user.id)
        }
      } else {
        toast.error(t('errorDeletingPhoto') || 'Failed to delete photo')
      }
    } catch (error) {
      toast.error(t('errorDeletingPhoto') || 'Failed to delete photo')
    } finally {
      setLoading(false)
    }
  }

  const handleEditPhoto = (photo: ProgressPhoto) => {
    setEditingPhoto(photo)
  }

  if (isLoading && photos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title') || 'Progress Photos'}</h1>
          <p className="text-muted-foreground">{t('subtitle') || 'Track your progress with photos'}</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('uploadPhoto') || 'Upload Photo'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('uploadPhoto') || 'Upload Photo'}</DialogTitle>
              <DialogDescription>
                {t('uploadPhotoDescription') || 'Upload a progress photo to track your transformation'}
              </DialogDescription>
            </DialogHeader>
            <PhotoUpload
              onSubmit={handleCreatePhoto}
              isLoading={isLoading || isSafeLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('totalPhotos') || 'Total Photos'}</CardTitle>
            <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{photos.length}</div>
            <p className="text-xs text-muted-foreground">{t('photosUploaded') || 'Photos uploaded'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('thisMonth') || 'This Month'}</CardTitle>
            <Grid3x3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {photos.filter(p => {
                const photoDate = new Date(p.photo_date)
                const now = new Date()
                return photoDate.getMonth() === now.getMonth() && photoDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">{t('photosThisMonth') || 'Photos this month'}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('lastPhoto') || 'Last Photo'}</CardTitle>
            <GitCompare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {photos.length > 0
                ? new Date(Math.max(...photos.map(p => new Date(p.photo_date).getTime())))
                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">{t('mostRecent') || 'Most recent'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Gallery and Comparison */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'gallery' | 'comparison')}>
        <TabsList>
          <TabsTrigger value="gallery">
            <Grid3x3 className="h-4 w-4 mr-2" />
            {t('gallery') || 'Gallery'}
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <GitCompare className="h-4 w-4 mr-2" />
            {t('comparison') || 'Comparison'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="space-y-4">
          <PhotoGallery
            photos={photos}
            onDelete={handleDeletePhoto}
            onEdit={handleEditPhoto}
            groupByDate={true}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <PhotoComparison photos={photos} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingPhoto && (
        <Dialog open={!!editingPhoto} onOpenChange={() => setEditingPhoto(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('editPhoto') || 'Edit Photo'}</DialogTitle>
              <DialogDescription>
                {t('editPhotoDescription') || 'Update photo information'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border">
                <PhotoImage
                  photoUrl={editingPhoto.photo_url}
                  alt="Photo"
                  fill
                  className="object-contain"
                />
              </div>
              <Button
                variant="destructive"
                onClick={async () => {
                  const confirmed = window.confirm(t('confirmDelete') || 'Are you sure you want to delete this photo?')
                  if (confirmed) {
                    await handleDeletePhoto(editingPhoto.id)
                    setEditingPhoto(null)
                  }
                }}
              >
                {tCommon('delete')} {t('photo')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

