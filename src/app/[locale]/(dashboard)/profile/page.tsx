/**
 * Profile Page
 * User profile and settings
 */

'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon, TrendingUp, Calendar, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationSettings } from '@/components/notifications/notification-settings'
import { StatsCardSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { statsService } from '@/domain/services/stats.service'
import { WorkoutStats } from '@/types'
import { formatDate, formatDuration } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const { workouts, loadWorkouts } = useWorkoutStore()
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    // Show initial loading state briefly
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  const loadData = async () => {
    if (!user) return
    
    // Don't block - show page immediately
    setIsLoading(true)
    
    // Load in parallel without blocking UI
    Promise.all([
      loadWorkouts(user.id),
      statsService.getUserStats(user.id)
    ]).then(([, statsResult]) => {
      if (statsResult.data) {
        setStats(statsResult.data)
      }
      setIsLoading(false)
    })
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    router.push(ROUTES.AUTH)
  }

  if (!user) return null

  const memberSince = user.created_at ? formatDate(user.created_at, 'MMMM yyyy') : 'Unknown'

  // Show loading skeleton on initial page load
  if (isInitialLoad) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-5 w-96 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
        </div>

        {/* User Info Skeleton */}
        <CardSkeleton />

        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Activity Skeleton */}
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account and view your progress</p>
        </div>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name || t('notSet') || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">{memberSince}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-xs">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        {!stats && isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_workouts || 0}</div>
                <p className="text-xs text-muted-foreground">Completed sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(stats?.total_duration || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Hours trained</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_sets || 0}</div>
                <p className="text-xs text-muted-foreground">Sets completed</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest workout sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No workouts recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {workouts.slice(0, 5).map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{formatDate(workout.date, 'PP')}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(workout.duration)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(ROUTES.WORKOUT_DETAIL(workout.id))}
                  >
                    {tCommon('view') || 'View'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Trained Muscle */}
      {stats?.most_trained_muscle && (
        <Card>
          <CardHeader>
            <CardTitle>Focus Area</CardTitle>
            <CardDescription>Your most trained muscle group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-4xl font-bold capitalize mb-2">
                  {stats.most_trained_muscle.replace('_', ' ')}
                </p>
                <p className="text-muted-foreground">Most trained muscle group</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <NotificationSettings />
    </div>
  )
}

