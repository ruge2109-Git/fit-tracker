/**
 * NavBar Component
 * Main navigation bar with theme toggle
 */

'use client'

import { useState } from 'react'
import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Dumbbell, Home, CalendarDays, BookOpen, ListTodo, User, Moon, Sun, Wrench, MessageSquare, Shield, Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/language/language-selector'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAdmin } from '@/hooks/use-admin'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function NavBar() {
  const t = useTranslations('common')
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { isAdmin } = useAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { href: ROUTES.DASHBOARD, labelKey: 'dashboard', icon: Home },
    { href: ROUTES.WORKOUTS, labelKey: 'workouts', icon: CalendarDays },
    { href: ROUTES.EXERCISES, labelKey: 'exercises', icon: BookOpen },
    { href: ROUTES.ROUTINES, labelKey: 'routines', icon: ListTodo },
    { href: ROUTES.TOOLS, labelKey: 'tools', icon: Wrench },
    { href: ROUTES.FEEDBACK, labelKey: 'feedback', icon: MessageSquare },
    { href: ROUTES.PROFILE, labelKey: 'profile', icon: User },
  ]

  // Add admin link if user is admin
  const allNavItems = isAdmin
    ? [...navItems, { href: ROUTES.ADMIN_FEEDBACK, labelKey: 'admin', icon: Shield }]
    : navItems

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
                  <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {allNavItems.map((item) => {
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
                  </nav>
                  
                  {/* Footer with Language & Theme */}
                  <div className="p-4 border-t space-y-3">
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

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {allNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md',
                    isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              )
            })}
          </div>

          {/* Language Selector & Theme Toggle - Desktop */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{t('toggleTheme')}</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

