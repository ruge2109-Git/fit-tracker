/**
 * BottomNav Component
 * Mobile-focused navigation bar for PWA experience
 */

'use client'

import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Home, Globe, CalendarDays, ListTodo, Scale, Menu, User, Target, Camera, Wrench, Moon, Sun, Shield, MessageSquare, Search, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAdmin } from '@/hooks/use-admin'
import { useTheme } from 'next-themes'
import { useSearchDialog } from '@/hooks/use-search-dialog'
import { useAiCoachStore } from '@/store/ai-coach.store'
import { useSocialStore } from '@/store/social.store'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer'

export function BottomNav() {
  const t = useTranslations('common')
  const pathname = usePathname()
  const { isAdmin } = useAdmin()
  const { theme, setTheme } = useTheme()
  const { openSearch } = useSearchDialog()
  const { unreadMessagesCount } = useSocialStore()
  const { toggle: toggleCoach, isOpen: isCoachOpen } = useAiCoachStore()

  const navItems = [
    { href: ROUTES.DASHBOARD, labelKey: 'dashboard', icon: Home },
    { href: ROUTES.WORKOUTS, labelKey: 'workouts', icon: CalendarDays },
    { href: ROUTES.ROUTINES, labelKey: 'routines', icon: ListTodo },
    { href: ROUTES.SOCIAL, labelKey: 'social', icon: Users },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all',
                isActive ? 'text-primary scale-110' : 'text-muted-foreground opacity-70'
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors relative",
                isActive ? "bg-primary/10" : ""
              )}>
                <Icon className={cn('h-5 w-5')} />
                {item.href === ROUTES.SOCIAL && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white shadow-sm ring-2 ring-background">
                    {unreadMessagesCount > 9 ? '+9' : unreadMessagesCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter text-center w-full px-0.5 leading-tight">
                {t(item.labelKey)}
              </span>
            </Link>
          )
        })}
        
        <Drawer>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground opacity-70">
              <div className="p-1.5 ">
                <Menu className="h-5 w-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter">{t('nav.more')}</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-[2.5rem] border-t-accent/20">
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader className="pb-0">
                <DrawerTitle className="text-2xl font-black uppercase italic tracking-tighter text-center">Menú Principal</DrawerTitle>
                <DrawerDescription className="text-center text-[10px] uppercase font-bold tracking-widest opacity-50">Explora todas las herramientas</DrawerDescription>
              </DrawerHeader>
              
              <div className="grid grid-cols-3 gap-4 p-6 pt-8">
                {/* Primary AI Button */}
                <DrawerClose asChild>
                  <button 
                    onClick={() => { toggleCoach() }}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-[2rem] transition-all active:scale-95",
                      isCoachOpen ? "bg-violet-500 text-white" : "bg-violet-500/10 text-violet-500"
                    )}
                  >
                    <Sparkles size={24} className={isCoachOpen ? "animate-pulse" : ""} />
                    <span className="text-[10px] font-black uppercase italic tracking-tighter text-center leading-tight">Coach IA</span>
                  </button>
                </DrawerClose>

                <DrawerClose asChild>
                  <button onClick={openSearch} className="flex flex-col items-center gap-3 p-4 rounded-[2rem] bg-accent/5 transition-all active:scale-95 text-muted-foreground">
                    <Search size={22} />
                    <span className="text-[10px] font-black uppercase italic tracking-tighter text-center leading-tight">{t('search')}</span>
                  </button>
                </DrawerClose>
                
                <DrawerNavItem href={ROUTES.BODY_MEASUREMENTS} icon={<Scale size={22} />} label={t('bodyMeasurements')} />
                <DrawerNavItem href={ROUTES.GOALS} icon={<Target size={22} />} label={t('goals')} />
                <DrawerNavItem href={ROUTES.PROGRESS_PHOTOS} icon={<Camera size={22} />} label={t('progressPhotos')} />
                <DrawerNavItem href={ROUTES.TOOLS} icon={<Wrench size={22} />} label={t('tools')} />
                <DrawerNavItem href={ROUTES.FEEDBACK} icon={<MessageSquare size={22} />} label={t('feedback')} />
                
                {isAdmin && (
                  <DrawerNavItem href={ROUTES.ADMIN} icon={<Shield size={22} />} label="Admin" highlight />
                )}

                <DrawerClose asChild>
                  <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex flex-col items-center gap-3 p-4 rounded-[2rem] bg-accent/10 text-muted-foreground transition-all active:scale-95"
                  >
                    {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                    <span className="text-[10px] font-black uppercase italic tracking-tighter text-center leading-tight">Tema</span>
                  </button>
                </DrawerClose>

                <DrawerNavItem href={ROUTES.PROFILE} icon={<User size={22} />} label={t('profile')} />
              </div>

              <div className="px-6 pb-8">
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full rounded-2xl font-black uppercase py-6 border-accent/20">Cerrar</Button>
                </DrawerClose>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  )
}

function DrawerNavItem({ href, icon, label, highlight }: { href: string, icon: React.ReactNode, label: string, highlight?: boolean }) {
  return (
    <DrawerClose asChild>
      <Link 
        href={href}
        className={cn(
          "flex flex-col items-center gap-3 p-4 rounded-[2rem] transition-all active:scale-95",
          highlight ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-accent/5 hover:bg-accent/10 text-muted-foreground"
        )}
      >
        <div className={cn(highlight ? "opacity-100" : "opacity-80")}>{icon}</div>
        <span className="text-[10px] font-black uppercase italic tracking-tighter text-center leading-tight">{label}</span>
      </Link>
    </DrawerClose>
  )
}

function IconWrapper({ children }: { children: React.ReactNode }) {
  return <div className="text-muted-foreground">{children}</div>
}
