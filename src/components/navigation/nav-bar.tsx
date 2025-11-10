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
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 font-bold text-xl">
            <Dumbbell className="h-6 w-6" />
            {t('appName')}
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              )
            })}
          </div>

          {/* Language Selector & Theme Toggle */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around pb-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

