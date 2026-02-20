/**
 * Admin Dashboard Page
 * Central hub for admin modules: Feedback, Audit Log, etc.
 */

'use client'

import { useAdmin } from '@/hooks/use-admin'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ROUTES } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { 
  Shield, 
  FileText, 
  MessageSquare, 
  Activity,
  ChevronRight,
  Users,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const adminModules = [
  {
    href: ROUTES.ADMIN_FEEDBACK,
    labelKey: 'feedbackModule',
    descKey: 'feedbackModuleDesc',
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    href: ROUTES.ADMIN_AUDIT,
    labelKey: 'auditModule',
    descKey: 'auditModuleDesc',
    icon: FileText,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
]

export default function AdminPage() {
  const t = useTranslations('admin')
  const { isAdmin, isLoading } = useAdmin()

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 px-2">
        <CardSkeleton />
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="rounded-3xl border-none bg-accent/5">
          <CardContent className="p-8 text-center space-y-3">
            <Shield className="h-12 w-12 text-destructive/50 mx-auto" />
            <p className="text-sm font-bold text-muted-foreground">
              {t('accessDenied') || 'Acceso denegado. Se requieren privilegios de administrador.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 px-2">
      {/* Header */}
      <header className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              {t('title') || 'Panel de Admin'}
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60">
              {t('subtitle') || 'Control total de la plataforma'}
            </p>
          </div>
        </div>
      </header>

      {/* Module Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {adminModules.map((module) => {
          const Icon = module.icon
          return (
            <Link key={module.href} href={module.href}>
              <Card className={cn(
                "rounded-3xl border bg-accent/5 overflow-hidden cursor-pointer group",
                "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5",
                "active:scale-[0.98] touch-manipulation",
                module.borderColor
              )}>
                <CardContent className="p-6 flex items-center gap-5">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                    "transition-transform duration-300 group-hover:scale-110",
                    module.bgColor
                  )}>
                    <Icon className={cn("h-7 w-7", module.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <h2 className="text-lg font-black uppercase tracking-tighter italic">
                      {t(module.labelKey) || module.labelKey}
                    </h2>
                    <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wide leading-relaxed">
                      {t(module.descKey) || ''}
                    </p>
                  </div>

                  <ChevronRight className={cn(
                    "h-5 w-5 text-muted-foreground/30 flex-shrink-0",
                    "transition-all duration-300 group-hover:text-primary group-hover:translate-x-1"
                  )} />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-8 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-20">
          ADMIN PANEL v2.0 • SECURE ACCESS ONLY
        </p>
      </div>
    </div>
  )
}
