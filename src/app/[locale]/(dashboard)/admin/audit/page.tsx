/**
 * Admin Audit Log Page
 * View audit logs and user activity (admin only)
 */

'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { auditLogRepository, AuditLogWithUser } from '@/domain/repositories/audit-log.repository'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Search, Filter, Download, RefreshCw, Calendar, User, Activity, ChevronsUpDown, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatDate, cn } from '@/lib/utils'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase/client'

interface UserOption {
  id: string
  email: string
  name: string | null
}

const ACTIONS = [
  // Auth
  'login',
  'logout',
  'signup',
  // Navigation
  'page_view',
  'session_start',
  'session_end',
  'pwa_launch',
  'app_foreground',
  'app_background',
  'connectivity_change',
  // Workouts
  'create_workout',
  'update_workout',
  'delete_workout',
  // Exercises
  'create_exercise',
  'update_exercise',
  'delete_exercise',
  // Routines
  'create_routine',
  'update_routine',
  'delete_routine',
  // Goals
  'create_goal',
  'update_goal',
  'delete_goal',
  'add_goal_progress',
  // Body
  'create_body_measurement',
  'update_body_measurement',
  'delete_body_measurement',
  // Progress Photos
  'create_progress_photo',
  'update_progress_photo',
  'delete_progress_photo',
  // Social
  'send_friend_request',
  'accept_friend_request',
  'reject_friend_request',
  'send_message',
  'send_dm',
  'create_feed_event',
  'update_social_profile',
  // AI
  'ai_coach_query',
  // Notifications
  'push_subscribe',
  'push_unsubscribe',
  // Feedback
  'submit_feedback',
  // Data
  'export_data',
  'import_data',
  'update_settings',
]

const ENTITY_TYPES = [
  'auth',
  'navigation',
  'workout',
  'exercise',
  'routine',
  'goal',
  'body_measurement',
  'progress_photo',
  'social',
  'chat',
  'friends',
  'feed',
  'ai',
  'notifications',
  'feedback',
  'settings',
  'data',
]

export default function AdminAuditPage() {
  const t = useTranslations('admin')
  const tCommon = useTranslations('common')
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const [logs, setLogs] = useState<AuditLogWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string>('all')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 50

  // User list for combobox
  const [users, setUsers] = useState<UserOption[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userComboOpen, setUserComboOpen] = useState(false)

  // Load users on mount
  useEffect(() => {
    if (!isAdminLoading && isAdmin) {
      loadUsers()
    }
  }, [isAdmin, isAdminLoading])

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name')
        .order('email', { ascending: true })
      if (!error && data) {
        setUsers(data)
      }
    } catch (err) {
      logger.error('Error loading users', err as Error, 'AdminAudit')
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdminLoading && isAdmin) {
      loadLogs()
    }
  }, [isAdmin, isAdminLoading, currentPage, selectedAction, selectedEntityType, selectedUserId, startDate, endDate])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      let result

      if (startDate && endDate) {
        result = await auditLogRepository.findByDateRange(startDate, endDate, itemsPerPage, (currentPage - 1) * itemsPerPage)
      } else if (selectedUserId !== 'all') {
        result = await auditLogRepository.findByUserId(selectedUserId, itemsPerPage, (currentPage - 1) * itemsPerPage)
      } else if (selectedAction !== 'all') {
        result = await auditLogRepository.findByAction(selectedAction, itemsPerPage, (currentPage - 1) * itemsPerPage)
      } else if (selectedEntityType !== 'all') {
        result = await auditLogRepository.findByEntityType(selectedEntityType, itemsPerPage, (currentPage - 1) * itemsPerPage)
      } else {
        result = await auditLogRepository.findAll(itemsPerPage, (currentPage - 1) * itemsPerPage)
      }

      if (result.data) {
        setLogs(result.data)
        // Note: Supabase doesn't return total count by default, would need to add that
        setTotalCount(result.data.length)
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      logger.error('Error loading audit logs', error as Error, 'AdminAudit')
      toast.error(t('auditLog.errorLoading'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadLogs()
  }

  const handleReset = () => {
    setSelectedUserId('all')
    setSelectedAction('all')
    setSelectedEntityType('all')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  const exportLogs = () => {
    // Simple CSV export
    const headers = [
      t('auditLog.exportHeaders.date'),
      t('auditLog.exportHeaders.user'),
      t('auditLog.exportHeaders.action'),
      t('auditLog.exportHeaders.entityType'),
      t('auditLog.exportHeaders.entityId'),
      t('auditLog.exportHeaders.details'),
      t('auditLog.exportHeaders.ipAddress'),
    ]
    const rows = logs.map(log => [
      formatDate(log.created_at, 'PPpp'),
      log.user?.email || log.user_id,
      t(`auditLog.actions.${log.action}`) || log.action,
      t(`auditLog.entityTypes.${log.entity_type}`) || log.entity_type,
      log.entity_id || '',
      JSON.stringify(log.details || {}),
      log.ip_address || '',
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isAdminLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">{t('auditLog.accessDenied')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('auditLog.title')}</h1>
        <p className="text-muted-foreground">{t('auditLog.description')}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>{t('auditLog.user') || 'Usuario'}</Label>
              <Popover open={userComboOpen} onOpenChange={setUserComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userComboOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedUserId === 'all'
                      ? (t('auditLog.allUsers') || 'Todos los usuarios')
                      : users.find(u => u.id === selectedUserId)?.email || selectedUserId.substring(0, 8) + '...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('auditLog.searchUser') || 'Buscar usuario...'} />
                    <CommandList>
                      <CommandEmpty>{t('auditLog.noUsersFound') || 'No se encontraron usuarios'}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedUserId('all')
                            setUserComboOpen(false)
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', selectedUserId === 'all' ? 'opacity-100' : 'opacity-0')} />
                          {t('auditLog.allUsers') || 'Todos los usuarios'}
                        </CommandItem>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.email} ${user.name || ''}`}
                            onSelect={() => {
                              setSelectedUserId(user.id)
                              setUserComboOpen(false)
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', selectedUserId === user.id ? 'opacity-100' : 'opacity-0')} />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{user.email}</span>
                              {user.name && <span className="text-xs text-muted-foreground">{user.name}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('auditLog.action')}</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder={t('auditLog.allActions')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('auditLog.allActions')}</SelectItem>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {t(`auditLog.actions.${action}`) || action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('auditLog.entityType')}</Label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('auditLog.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('auditLog.allTypes')}</SelectItem>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`auditLog.entityTypes.${type}`) || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{tCommon('actions')}</Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  {t('auditLog.reset')}
                </Button>
                <Button variant="outline" onClick={loadLogs} size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={exportLogs} size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('auditLog.startDate')}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('auditLog.endDate')}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('auditLog.activityLog')}
          </CardTitle>
          <CardDescription>
            {t('auditLog.showingLogs', { count: logs.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('auditLog.noLogs')}</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{t(`auditLog.actions.${log.action}`) || log.action}</Badge>
                        <Badge variant="secondary">{t(`auditLog.entityTypes.${log.entity_type}`) || log.entity_type}</Badge>
                        {log.entity_id && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.entity_id.substring(0, 8)}...
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{log.user?.email || log.user_id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(log.created_at, 'PPpp')}</span>
                        </div>
                        {log.ip_address && (
                          <span className="font-mono text-xs">{log.ip_address}</span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            {t('auditLog.viewDetails')}
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {logs.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                {t('auditLog.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('auditLog.page', { page: currentPage })}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={logs.length < itemsPerPage}
              >
                {t('auditLog.next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

