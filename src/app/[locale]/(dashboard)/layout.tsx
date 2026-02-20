/**
 * Dashboard Layout
 * Protected layout with navigation
 */

'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, usePathname } from '@/i18n/routing'
import { NavBar } from '@/components/navigation/nav-bar'
import { BottomNav } from '@/components/navigation/bottom-nav'
import { NavigationProgress } from '@/components/navigation/navigation-progress'
import { NavigationLoader } from '@/components/navigation/navigation-loader'
import { NavigationInterceptor } from '@/components/navigation/navigation-interceptor'
import { PageTransition } from '@/components/ui/page-transition'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { OfflineIndicator } from '@/components/offline/offline-indicator'
import { ActiveRoutineButton } from '@/components/workouts/active-routine-button'
import { ActiveSessionBanner } from '@/components/workouts/active-session-banner'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts'
import { SearchDialogProvider } from '@/hooks/use-search-dialog'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/lib/constants'
import { AiCoachChat } from '@/components/ai/ai-coach-chat'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if it's a public routine page
  const isPublicRoutine = pathname?.match(/\/routines\/(?!new$)[^/]+$/)

  if (!user && !isPublicRoutine) {
    return null
  }

  return (
    <SearchDialogProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <NavigationInterceptor />
        <NavigationProgress />
        <NavigationLoader />
        
        {/* Top Navbar - hidden on very small mobile if preferred, but usually okay */}
        <NavBar />
        
        <main className="flex-1 container mx-auto px-4 py-8 pb-32 md:pb-8">
          <Suspense
            fallback={
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <div className="h-9 w-64 bg-muted rounded-md animate-pulse" />
                  <div className="h-5 w-96 bg-muted rounded-md animate-pulse" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              </div>
            }
          >
            <div className="mb-4 hidden md:block">
              <Breadcrumbs />
            </div>
            <PageTransition>
              {children}
            </PageTransition>
          </Suspense>
        </main>

        <OfflineIndicator />
        
        {/* Desktop Active Button */}
        {user && (
          <div className="hidden md:block">
            <ActiveRoutineButton />
          </div>
        )}

        {/* Mobile Active Indicator */}
        {user && <ActiveSessionBanner />}
        
        {user && <BottomNav />}
        <KeyboardShortcuts />
        {/* AI Coach floating chat — available on all dashboard pages */}
        {user && <AiCoachChat />}
      </div>
    </SearchDialogProvider>
  )
}

