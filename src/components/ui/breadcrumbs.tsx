/**
 * Breadcrumbs Component
 * Displays navigation breadcrumbs for nested pages
 */

'use client'

import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const t = useTranslations('common')

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const segments = pathname.split('/').filter(Boolean)
    const result: BreadcrumbItem[] = []

    // Skip locale segment
    const localeIndex = segments.findIndex(seg => ['es', 'en'].includes(seg))
    const pathSegments = localeIndex >= 0 ? segments.slice(localeIndex + 1) : segments

    // Add home
    result.push({
      label: t('dashboard') || 'Dashboard',
      href: ROUTES.DASHBOARD,
    })

    // Build breadcrumbs from path segments
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Skip if it's the last segment and it's an ID (UUID-like)
      if (index === pathSegments.length - 1 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        return
      }

      // Map common segments to translations
      let label = segment
      if (segment === 'workouts') {
        label = t('workouts') || 'Workouts'
      } else if (segment === 'exercises') {
        label = t('exercises') || 'Exercises'
      } else if (segment === 'routines') {
        label = t('routines') || 'Routines'
      } else if (segment === 'new') {
        label = t('create') || 'Create'
      } else if (segment === 'edit') {
        label = t('edit') || 'Edit'
      } else if (segment === 'profile') {
        label = t('profile') || 'Profile'
      } else if (segment === 'tools') {
        label = t('tools') || 'Tools'
      } else if (segment === 'feedback') {
        label = t('feedback') || 'Feedback'
      } else if (segment === 'stats') {
        label = t('stats') || 'Stats'
      } else {
        // Capitalize first letter
        label = segment.charAt(0).toUpperCase() + segment.slice(1)
      }

      result.push({
        label,
        href: index < pathSegments.length - 1 ? currentPath : undefined,
      })
    })

    return result
  })()

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          
          return (
            <li key={index} className="flex items-center">
              {index === 0 ? (
                <Link
                  href={item.href || ROUTES.DASHBOARD}
                  className="flex items-center hover:text-foreground transition-colors"
                  aria-label={t('dashboard') || 'Dashboard'}
                >
                  <Home className="h-4 w-4" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mx-1" aria-hidden="true" />
                  {isLast ? (
                    <span
                      className="font-medium text-foreground"
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className="hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

