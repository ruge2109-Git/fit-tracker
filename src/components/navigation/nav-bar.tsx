/**
 * NavBar Component
 * Main navigation bar with theme toggle
 */

'use client'

import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Dumbbell, Home, CalendarDays, BookOpen, ListTodo, User, Moon, Sun, Wrench } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/language/language-selector'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

export function NavBar() {
  const t = useTranslations('common')
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const navItems = [
    { href: ROUTES.DASHBOARD, labelKey: 'dashboard', icon: Home },
    { href: ROUTES.WORKOUTS, labelKey: 'workouts', icon: CalendarDays },
    { href: ROUTES.EXERCISES, labelKey: 'exercises', icon: BookOpen },
    { href: ROUTES.ROUTINES, labelKey: 'routines', icon: ListTodo },
    { href: ROUTES.TOOLS, labelKey: 'tools', icon: Wrench },
    { href: ROUTES.PROFILE, labelKey: 'profile', icon: User },
  ]

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-1.5 sm:gap-2 font-bold text-base sm:text-xl shrink-0">
            <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">{t('appName')}</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {navItems.map((item) => {
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

          {/* Language Selector & Theme Toggle */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <div className="flex items-center justify-between gap-1 px-1 py-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-w-[60px] px-2 py-1.5 rounded-md transition-colors text-[10px] sm:text-xs',
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:bg-muted active:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="text-center leading-tight font-medium truncate w-full">{t(item.labelKey)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

