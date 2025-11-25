/**
 * Keyboard Shortcuts Component
 * Provides global keyboard shortcuts (Ctrl+K for search, etc.)
 */

'use client'

import { useEffect, useState } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useTranslations } from 'next-intl'
import { Command } from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ROUTES } from '@/lib/constants'
import { Search, Home, CalendarDays, BookOpen, ListTodo, Wrench, User, MessageSquare } from 'lucide-react'
import { usePathname } from '@/i18n/routing'

interface Shortcut {
  keys: string[]
  label: string
  action: () => void
  icon: React.ComponentType<{ className?: string }>
}

export function KeyboardShortcuts() {
  const router = useNavigationRouter()
  const pathname = usePathname()
  const t = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const shortcuts: Shortcut[] = [
    {
      keys: ['Ctrl', 'K'],
      label: t('search') || 'Search',
      action: () => setIsOpen(true),
      icon: Search,
    },
    {
      keys: ['Ctrl', 'H'],
      label: t('dashboard') || 'Dashboard',
      action: () => router.push(ROUTES.DASHBOARD),
      icon: Home,
    },
    {
      keys: ['Ctrl', 'W'],
      label: t('workouts') || 'Workouts',
      action: () => router.push(ROUTES.WORKOUTS),
      icon: CalendarDays,
    },
    {
      keys: ['Ctrl', 'E'],
      label: t('exercises') || 'Exercises',
      action: () => router.push(ROUTES.EXERCISES),
      icon: BookOpen,
    },
    {
      keys: ['Ctrl', 'R'],
      label: t('routines') || 'Routines',
      action: () => router.push(ROUTES.ROUTINES),
      icon: ListTodo,
    },
    {
      keys: ['Ctrl', 'T'],
      label: t('tools') || 'Tools',
      action: () => router.push(ROUTES.TOOLS),
      icon: Wrench,
    },
    {
      keys: ['Ctrl', 'P'],
      label: t('profile') || 'Profile',
      action: () => router.push(ROUTES.PROFILE),
      icon: User,
    },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      // Other shortcuts only work when not in input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ctrl+H for home
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        router.push(ROUTES.DASHBOARD)
      }

      // Ctrl+W for workouts
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        router.push(ROUTES.WORKOUTS)
      }

      // Ctrl+E for exercises
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        router.push(ROUTES.EXERCISES)
      }

      // Ctrl+R for routines
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        router.push(ROUTES.ROUTINES)
      }

      // Ctrl+T for tools
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        router.push(ROUTES.TOOLS)
      }

      // Ctrl+P for profile
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        router.push(ROUTES.PROFILE)
      }

      // Escape to close search
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, isOpen])

  const handleShortcutClick = (shortcut: Shortcut) => {
    shortcut.action()
    if (shortcut.keys.includes('K')) {
      // Keep search open
    } else {
      setIsOpen(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogTitle className="sr-only">{t('shortcuts') || 'Keyboard Shortcuts'}</DialogTitle>
          <Command className="rounded-lg border-0">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                placeholder={t('search') || 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {t('shortcuts') || 'Shortcuts'}
              </div>
              <div className="space-y-1">
                {shortcuts.map((shortcut, index) => {
                  const Icon = shortcut.icon
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleShortcutClick(shortcut)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{shortcut.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}

