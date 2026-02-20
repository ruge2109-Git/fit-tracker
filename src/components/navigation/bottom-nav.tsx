/**
 * BottomNav Component
 * Mobile-focused navigation bar for PWA experience
 */

'use client'

import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Home, Globe, CalendarDays, ListTodo, Scale, Menu, User, Target, Camera, Wrench, Moon, Sun, Shield, MessageSquare, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAdmin } from '@/hooks/use-admin'
import { useTheme } from 'next-themes'
import { useSearchDialog } from '@/hooks/use-search-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function BottomNav() {
  const t = useTranslations('common')
  const pathname = usePathname()
  const { isAdmin } = useAdmin()
  const { theme, setTheme } = useTheme()
  const { openSearch } = useSearchDialog()

  const navItems = [
    { href: ROUTES.DASHBOARD, labelKey: 'dashboard', icon: Home },
    { href: ROUTES.WORKOUTS, labelKey: 'workouts', icon: CalendarDays },
    { href: ROUTES.ROUTINES, labelKey: 'routines', icon: ListTodo },
    { href: ROUTES.BODY_MEASUREMENTS, labelKey: 'bodyMeasurements', icon: Scale },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'animate-in zoom-in-95 duration-300')} />
              <span className="text-[10px] font-medium truncate px-1">
                {t(item.labelKey)}
              </span>
            </Link>
          )
        })}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t('nav.more')}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-4 rounded-3xl p-2 shadow-2xl border-accent/20">
            <DropdownMenuLabel className="px-3 pt-3 text-xs uppercase tracking-widest text-muted-foreground font-black">
              {t('nav.more')}
            </DropdownMenuLabel>
            
            <div className="grid grid-cols-1 gap-1 pt-2">
              <DropdownMenuItem onClick={openSearch} className="rounded-2xl h-12 gap-3 px-4 focus:bg-primary/10 transition-all">
                <IconWrapper><Search size={18} /></IconWrapper>
                <span className="font-bold text-sm tracking-tight">{t('search')}</span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-2xl h-12 gap-3 px-4 focus:bg-primary/10">
                <Link href={ROUTES.SOCIAL}>
                  <IconWrapper><Globe size={18} /></IconWrapper>
                  <span className="font-bold text-sm tracking-tight">{t('social')}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-2xl h-12 gap-3 px-4 focus:bg-primary/10">
                <Link href={ROUTES.GOALS}>
                  <IconWrapper><Target size={18} /></IconWrapper>
                  <span className="font-bold text-sm tracking-tight">{t('goals')}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-2xl h-12 gap-3 px-4 focus:bg-primary/10">
                <Link href={ROUTES.PROGRESS_PHOTOS}>
                  <IconWrapper><Camera size={18} /></IconWrapper>
                  <span className="font-bold text-sm tracking-tight">{t('progressPhotos')}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-2xl h-12 gap-3 px-4 focus:bg-primary/10">
                <Link href={ROUTES.TOOLS}>
                  <IconWrapper><Wrench size={18} /></IconWrapper>
                  <span className="font-bold text-sm tracking-tight">{t('tools')}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-2xl h-12 gap-3 px-4 focus:bg-primary/10">
                <Link href={ROUTES.FEEDBACK}>
                  <IconWrapper><MessageSquare size={18} /></IconWrapper>
                  <span className="font-bold text-sm tracking-tight">{t('feedback')}</span>
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <DropdownMenuItem asChild className="rounded-2xl h-12 gap-3 px-4 focus:bg-primary/10 bg-primary/5">
                  <Link href={ROUTES.ADMIN_FEEDBACK}>
                    <IconWrapper><Shield size={18} className="text-primary" /></IconWrapper>
                    <span className="font-bold text-sm tracking-tight text-primary">{t('nav.administration')}</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </div>

            <DropdownMenuSeparator className="my-2 bg-accent/20" />

            <div className="flex items-center justify-between px-1 gap-1">
              <DropdownMenuItem 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex-1 rounded-2xl h-12 justify-center gap-2 focus:bg-primary/10"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild className="flex-[2] rounded-2xl h-12 justify-start gap-3 px-4 focus:bg-primary/10 border border-accent/10">
                <Link href={ROUTES.PROFILE}>
                  <User size={18} className="text-primary" />
                  <span className="font-bold text-sm tracking-tight">{t('profile')}</span>
                </Link>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

function IconWrapper({ children }: { children: React.ReactNode }) {
  return <div className="text-muted-foreground">{children}</div>
}
