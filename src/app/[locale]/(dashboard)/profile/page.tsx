/**
 * Profile Page Redesign
 * A premium, tabbed interface for user progress and settings
 */

'use client'

import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { 
  LogOut, 
  User as UserIcon, 
  TrendingUp, 
  Calendar, 
  Award, 
  Settings, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Dumbbell,
  ChevronRight,
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationSettings } from '@/components/notifications/notification-settings'
import { DataManagement } from '@/components/data/data-management'
import { BackupManager } from '@/components/data/backup-manager'
import { UsageStatsComponent } from '@/components/data/usage-stats'
import { StatsCardSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton'
import { OneRepMaxDisplay } from '@/components/profile/one-rep-max-display'
import { StreakBadges } from '@/components/profile/streak-badges'
import { AppSettings } from '@/components/profile/app-settings'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { statsService } from '@/domain/services/stats.service'
import { WorkoutStats } from '@/types'
import { formatDate, formatDuration, cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProfilePage() {
  const router = useNavigationRouter()
  const { user, signOut } = useAuthStore()
  const { workouts, loadWorkouts } = useWorkoutStore()
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [oneRMData, setOneRMData] = useState<{ exercise_name: string; one_rm: number; date: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const loadData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [, statsResult, oneRMResult] = await Promise.all([
        loadWorkouts(user.id),
        statsService.getUserStats(user.id),
        statsService.getPersonalBest1RMs(user.id)
      ])
      
      if (statsResult.data) setStats(statsResult.data)
      if (oneRMResult.data) setOneRMData(oneRMResult.data)
    } catch (error) {
      logger.error('Error loading profile data', error as Error, 'ProfilePage')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    router.push(ROUTES.AUTH)
  }

  if (!user) return null

  const memberSince = user.created_at ? formatDate(user.created_at, 'MMMM yyyy') : 'Unknown'
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'

  if (isInitialLoad) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="h-32 w-full bg-muted rounded-3xl animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Profile Hero Header */}
      <header className="relative mb-8 pt-4">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 px-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative h-28 w-28 rounded-full bg-background border-4 border-background overflow-hidden flex items-center justify-center text-3xl font-black text-primary shadow-xl">
              {initials}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">{user.name || 'Atleta'}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {t('memberSince')} {memberSince}</span>
              <span className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5" /> {user.email}</span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="rounded-full border-muted-foreground/20 font-bold uppercase tracking-tighter text-[10px]" onClick={handleSignOut}>
            <LogOut className="h-3 w-3 mr-2" />
            {tAuth('logout') || 'Sign Out'}
          </Button>
        </div>
      </header>

      {/* Main Content Tabs */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-muted/50 p-1 rounded-2xl h-12">
          <TabsTrigger value="progress" className="rounded-xl font-bold uppercase tracking-tighter text-xs data-[state=active]:shadow-md">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('consistency')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl font-bold uppercase tracking-tighter text-xs data-[state=active]:shadow-md">
            <Settings className="h-4 w-4 mr-2" />
            {tCommon('nav.account') || 'Ajustes'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6 outline-none">
          {/* Career Totals Grid */}
          <section className="space-y-4">
            <div className="px-1">
              <h2 className="text-xl font-black uppercase tracking-tighter italic">{t('careerTotals')}</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">{t('careerSummary')}</p>
            </div>
            
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="bg-accent/5 rounded-3xl p-5 border border-border/5 transition-all hover:bg-accent/10">
                <div className="h-10 w-10 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-3">
                  <Activity className="h-5 w-5 text-violet-500" />
                </div>
                <div className="text-2xl font-black tracking-tighter leading-none mb-1">{stats?.total_workouts || 0}</div>
                <div className="text-[10px] font-black uppercase text-muted-foreground opacity-60 leading-tight">{t('completedSessions')}</div>
              </div>

              <div className="bg-accent/5 rounded-3xl p-5 border border-border/5 transition-all hover:bg-accent/10">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-3">
                  <Clock className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="text-2xl font-black tracking-tighter leading-none mb-1">
                  {Math.floor((stats?.total_duration || 0) / 60)}h
                </div>
                <div className="text-[10px] font-black uppercase text-muted-foreground opacity-60 leading-tight">{t('hoursTrained')}</div>
              </div>

              <div className="bg-accent/5 rounded-3xl p-5 border border-border/5 transition-all hover:bg-accent/10">
                <div className="h-10 w-10 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center mb-3">
                  <Dumbbell className="h-5 w-5 text-fuchsia-500" />
                </div>
                <div className="text-2xl font-black tracking-tighter leading-none mb-1">{stats?.total_sets || 0}</div>
                <div className="text-[10px] font-black uppercase text-muted-foreground opacity-60 leading-tight">{t('setsCompleted')}</div>
              </div>

              <div className="bg-accent/5 rounded-3xl p-5 border border-border/5 transition-all hover:bg-accent/10">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-2xl font-black tracking-tighter leading-none mb-1">
                  {Math.round((stats?.total_volume || 0) / 1000)}t
                </div>
                <div className="text-[10px] font-black uppercase text-muted-foreground opacity-60 leading-tight">Toneladas Levantadas</div>
              </div>
            </div>
          </section>

          {/* Performance & Achievements */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <StreakBadges userId={user.id} />
              <OneRepMaxDisplay data={oneRMData} />
            </div>
            
            <div className="space-y-6">
              {/* Focus Area Visual */}
              {stats?.most_trained_muscle && (
                <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter italic">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {t('focusArea')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                         <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-[spin_3s_linear_infinite]"></div>
                         <Dumbbell className="h-10 w-10 text-primary" />
                      </div>
                      <p className="text-3xl font-black capitalize tracking-tighter mb-1">
                        {stats.most_trained_muscle.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-[200px]">
                        {t('focusDescription')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity List */}
              <Card className="rounded-3xl border-none bg-accent/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold uppercase tracking-tighter italic">{t('recentActivity')}</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {workouts.length === 0 ? (
                    <p className="text-center text-xs font-bold text-muted-foreground py-8 uppercase tracking-widest opacity-40">
                      {t('noWorkouts')}
                    </p>
                  ) : (
                    workouts.slice(0, 4).map((workout) => (
                      <div
                        key={workout.id}
                        className="flex items-center justify-between p-4 bg-background/40 hover:bg-background/80 rounded-2xl cursor-pointer transition-all border border-border/5 group"
                        onClick={() => router.push(ROUTES.WORKOUT_DETAIL(workout.id))}
                      >
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-muted flex flex-col items-center justify-center text-center">
                              <span className="text-[8px] font-black uppercase text-muted-foreground leading-none">
                                {formatDate(workout.date, 'MMM')}
                              </span>
                              <span className="text-base font-black leading-none mt-0.5">
                                {formatDate(workout.date, 'd')}
                              </span>
                           </div>
                           <div>
                              <p className="font-bold text-sm tracking-tighter uppercase italic">{workout.routine_name || 'Free Session'}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {formatDuration(workout.duration)}
                              </p>
                           </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    ))
                  )}
                  {workouts.length > 4 && (
                    <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-2xl" onClick={() => router.push(ROUTES.WORKOUTS)}>
                      Ver Todo el Historial
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 outline-none">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter italic">
                    <UserIcon className="h-5 w-5 text-primary" />
                    {t('accountInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="grid gap-4">
                    <div className="p-4 rounded-2xl bg-background/40 border border-border/5">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest opacity-60">ID DE USUARIO</p>
                      <p className="font-mono text-[10px] break-all opacity-80">{user.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <NotificationSettings />
            </div>

            <div className="space-y-6">
              <AppSettings />
              
              <section className="space-y-4">
                 <div className="px-1 flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <h2 className="text-xl font-black uppercase tracking-tighter italic">
                      {user.is_admin ? 'Infraestructura & Datos' : 'Gestión de Datos'}
                    </h2>
                 </div>
                 <DataManagement />
                 {user.is_admin && (
                   <>
                     <BackupManager />
                     <UsageStatsComponent />
                   </>
                 )}
              </section>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* App Version Info */}
      <footer className="mt-12 text-center opacity-20 group hover:opacity-100 transition-opacity">
        <p className="text-[8px] font-black uppercase tracking-[0.3em]">FitTrackr Pro Series • v2.1.0 • Built for Performance</p>
      </footer>
    </div>
  )
}
