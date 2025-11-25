/**
 * Saved Filters Manager Component
 * Allows saving, loading, and managing filter presets
 */

'use client'

import { useState } from 'react'
import { useSavedFilters, SavedFilter } from '@/hooks/use-saved-filters'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bookmark, BookmarkCheck, Trash2, Star, StarOff, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SavedFiltersManagerProps {
  type: 'workout' | 'exercise' | 'routine'
  currentFilters: Record<string, any>
  onApplyFilter: (filters: Record<string, any>) => void
}

export function SavedFiltersManager({ type, currentFilters, onApplyFilter }: SavedFiltersManagerProps) {
  const t = useTranslations('common')
  const { savedFilters, saveFilter, deleteFilter, toggleFavorite, getFiltersByType } = useSavedFilters()
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)

  const typeFilters = getFiltersByType(type)
  const hasActiveFilters = Object.values(currentFilters).some(v => v !== '' && v !== null && v !== undefined)

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error(t('filterNameRequired') || 'Filter name is required')
      return
    }

    saveFilter({
      name: filterName,
      type,
      filters: currentFilters,
      isFavorite,
    })

    setFilterName('')
    setIsFavorite(false)
    setSaveDialogOpen(false)
    toast.success(t('filterSaved') || 'Filter saved successfully')
  }

  const handleApplyFilter = (filter: SavedFilter) => {
    onApplyFilter(filter.filters)
    toast.success(t('filterApplied') || 'Filter applied')
  }

  const handleDeleteFilter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteFilter(id)
    toast.success(t('filterDeleted') || 'Filter deleted')
  }

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(id)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Saved Filters Dropdown */}
      {typeFilters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              {t('savedFilters') || 'Saved Filters'}
              {typeFilters.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {typeFilters.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>{t('savedFilters') || 'Saved Filters'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {typeFilters
              .sort((a, b) => {
                // Favorites first
                if (a.isFavorite && !b.isFavorite) return -1
                if (!a.isFavorite && b.isFavorite) return 1
                return 0
              })
              .map((filter) => (
                <DropdownMenuItem
                  key={filter.id}
                  onClick={() => handleApplyFilter(filter)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {filter.isFavorite ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate">{filter.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleToggleFavorite(filter.id, e)}
                    >
                      {filter.isFavorite ? (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => handleDeleteFilter(filter.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Save Current Filter Button */}
      {hasActiveFilters && (
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              {t('saveFilter') || 'Save Filter'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('saveFilter') || 'Save Filter'}</DialogTitle>
              <DialogDescription>
                {t('saveFilterDescription') || 'Save your current filter settings for quick access'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="filter-name">{t('filterName') || 'Filter Name'}</Label>
                <Input
                  id="filter-name"
                  placeholder={t('filterNamePlaceholder') || 'e.g., Last 30 days, High intensity'}
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveFilter()
                    }
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="favorite" className="flex items-center gap-2 cursor-pointer">
                  <Star className="h-4 w-4" />
                  {t('markAsFavorite') || 'Mark as favorite'}
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleSaveFilter}>
                  {t('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

