/**
 * NavBar Component
 * Main navigation bar with theme toggle
 */

'use client'

import { useState } from 'react'
import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Dumbbell, Home, CalendarDays, BookOpen, ListTodo, User, Moon, Sun, Wrench, MessageSquare, Shield, Menu, ChevronDown, Search, FileText } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/language/language-selector'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAdmin } from '@/hooks/use-admin'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSearchDialog } from '@/hooks/use-search-dialog'

export function NavBar() {
  const t = useTranslations('common')
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { isAdmin } = useAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { openSearch } = useSearchDialog()

  // Organize navigation items by sections
  const navSections: Array<{
    title: string
    items: Array<{
      href: string
      labelKey: string
      icon: React.ComponentType<{ className?: string }>
    }>
  }> = [
    {
      title: 'main',
      items: [
        { href: ROUTES.DASHBOARD, labelKey: 'dashboard', icon: Home },
      ],
    },
    {
      title: 'training',
      items: [
        { href: ROUTES.WORKOUTS, labelKey: 'workouts', icon: CalendarDays },
        { href: ROUTES.EXERCISES, labelKey: 'exercises', icon: BookOpen },
        { href: ROUTES.ROUTINES, labelKey: 'routines', icon: ListTodo },
      ],
    },
    {
      title: 'utilities',
      items: [
        { href: ROUTES.TOOLS, labelKey: 'tools', icon: Wrench },
      ],
    },
    {
      title: 'support',
      items: [
        { href: ROUTES.FEEDBACK, labelKey: 'feedback', icon: MessageSquare },
      ],
    },
    {
      title: 'account',
      items: [
        { href: ROUTES.PROFILE, labelKey: 'profile', icon: User },
      ],
    },
  ]

  // Add admin section if user is admin
  if (isAdmin) {
    navSections.push(    {
      title: 'administration',
      items: [
        { href: ROUTES.ADMIN_FEEDBACK, labelKey: 'admin', icon: Shield },
        { href: ROUTES.ADMIN_AUDIT, labelKey: 'auditLog', icon: FileText },
      ],
    })
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Mobile Menu Button & Logo */}
          <div className="flex items-center gap-2 md:gap-0">
            {/* Mobile Menu Button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('openMenu') || 'Open menu'}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0">
                <SheetHeader className="p-6 border-b">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-6 w-6 text-primary" />
                    <SheetTitle className="text-xl font-bold">{t('appName')}</SheetTitle>
                  </div>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100vh-80px)]">
                  {/* Navigation Items */}
                  <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {navSections.map((section) => (
                      <div key={section.title} className="space-y-2">
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t(`nav.${section.title}`) || section.title}
                        </h3>
                        <div className="space-y-1">
                          {section.items.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                            
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                  isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                              >
                                <Icon className="h-5 w-5" />
                                {t(item.labelKey)}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </nav>
                  
                  {/* Footer with Search, Language & Theme */}
                  <div className="p-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('search') || 'Search'}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          openSearch()
                          setSidebarOpen(false)
                        }}
                        className="h-9 w-9"
                      >
                        <Search className="h-4 w-4" />
                        <span className="sr-only">{t('search')}</span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('language') || 'Language'}</span>
                      <LanguageSelector />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('theme') || 'Theme'}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="h-9 w-9"
                      >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">{t('toggleTheme')}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-1.5 sm:gap-2 font-bold text-base sm:text-xl shrink-0">
              <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">{t('appName')}</span>
            </Link>
          </div>

          {/* Mobile Search Button */}
          <div className="flex md:hidden items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openSearch}
                    className="h-9 w-9"
                    aria-label={t('search')}
                  >
                    <Search className="h-5 w-5" />
                    <span className="sr-only">{t('search')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('search')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navSections.map((section, sectionIndex) => {
              // If section has only one item, show it directly
              if (section.items.length === 1) {
                const item = section.items[0]
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <div key={section.title} className="flex items-center">
                    {sectionIndex > 0 && (
                      <div className="h-6 w-px bg-border mx-2" aria-hidden="true" />
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md',
                              isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'
                            )}
                            aria-label={t(item.labelKey)}
                          >
                            <Icon className="h-4 w-4" />
                            {t(item.labelKey)}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t(item.labelKey)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )
              }
              
              // If section has multiple items, show as dropdown
              const hasActiveItem = section.items.some(
                item => pathname === item.href || pathname.startsWith(item.href + '/')
              )
              
              return (
                <div key={section.title} className="flex items-center">
                  {sectionIndex > 0 && (
                    <div className="h-6 w-px bg-border mx-2" aria-hidden="true" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          'flex items-center gap-2 text-sm font-medium px-2 py-1 h-auto',
                          hasActiveItem ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                        )}
                      >
                        {t(`nav.${section.title}`)}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>{t(`nav.${section.title}`)}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {section.items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        
                        return (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link
                              href={item.href}
                              className={cn(
                                'flex items-center gap-2 cursor-pointer',
                                isActive && 'bg-accent'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {t(item.labelKey)}
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>

          {/* Search, Language Selector & Theme Toggle - Desktop */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openSearch}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    aria-label={t('search')}
                  >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">{t('search')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('search')} (Ctrl+K)</p>
                </TooltipContent>
              </Tooltip>
              <LanguageSelector />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    aria-label={t('toggleTheme')}
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">{t('toggleTheme')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('toggleTheme')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </nav>
  )
}
