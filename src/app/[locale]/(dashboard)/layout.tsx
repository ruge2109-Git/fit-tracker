/**
 * Dashboard Layout
 * Protected layout with navigation
 */

'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/navigation/nav-bar'
import { NavigationProgress } from '@/components/navigation/navigation-progress'
import { PageTransition } from '@/components/ui/page-transition'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { OfflineIndicator } from '@/components/offline/offline-indicator'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/lib/constants'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading, loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(ROUTES.AUTH)
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationProgress />
      <NavBar />
      <main className="container mx-auto px-4 py-8">
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
          <PageTransition>
            {children}
          </PageTransition>
        </Suspense>
      </main>
      <OfflineIndicator />
    </div>
  )
}

