/**
 * Progress Photos Page
 * Displays all user progress photos with gallery and comparison features
 */

'use client'

import { useEffect, useState } from 'react'
import { Plus, Camera, Grid3x3, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60 italic mb-1">
            {t('title') || 'Progress Photos'}
          </h1>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground/90">
             {t('subtitle') || 'Gallery'}
          </h2>
        </div>
        <Drawer open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DrawerTrigger asChild>
            <Button 
                size="sm"
                className="h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-primary text-white shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all pt-6 pb-6 w-full sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              {t('uploadPhoto') || 'Upload Photo'}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
             <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                <DrawerTitle>{t('uploadPhoto') || 'Upload Photo'}</DrawerTitle>
                <DrawerDescription>
                    {t('uploadPhotoDescription') || 'Upload a progress photo to track your transformation'}
                </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 pb-0">
                    <PhotoUpload
                    onSubmit={handleCreatePhoto}
                    isLoading={isLoading || isSafeLoading}
                    />
                </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3">
        <Card className="rounded-[2rem] border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('totalPhotos') || 'Total Photos'}</CardTitle>
            <Camera className="h-4 w-4 text-primary/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black italic tracking-tighter text-foreground">{photos.length}</div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{t('photosUploaded') || 'Photos uploaded'}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('thisMonth') || 'This Month'}</CardTitle>
            <Grid3x3 className="h-4 w-4 text-primary/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black italic tracking-tighter text-foreground">
              {photos.filter(p => {
                const photoDate = new Date(p.photo_date)
                const now = new Date()
                return photoDate.getMonth() === now.getMonth() && photoDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{t('photosThisMonth') || 'Photos this month'}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1 rounded-[2rem] border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('lastPhoto') || 'Last Photo'}</CardTitle>
            <GitCompare className="h-4 w-4 text-primary/40" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-black italic tracking-tighter text-foreground mt-1">
              {photos.length > 0
                ? new Date(Math.max(...photos.map(p => new Date(p.photo_date).getTime())))
                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '-'}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{t('mostRecent') || 'Most recent'}</p>
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

      {/* Edit Drawer */}
      {editingPhoto && (
        <Drawer open={!!editingPhoto} onOpenChange={(open) => { if (!open) setEditingPhoto(null) }}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>{t('editPhoto') || 'Edit Photo'}</DrawerTitle>
              <DrawerDescription>
                {t('editPhotoDescription') || 'Update photo information'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-4 overflow-y-auto">
              <div className="relative aspect-[3/4] w-full max-h-[50vh] rounded-2xl overflow-hidden border">
                <PhotoImage
                  photoUrl={editingPhoto.photo_url}
                  alt="Photo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <DrawerFooter className="pt-4">
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
              <DrawerClose asChild>
                <Button variant="outline">{tCommon('cancel')}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}

