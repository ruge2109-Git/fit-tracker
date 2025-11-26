/**
 * Automatic Backup Service
 * Handles automatic backups of user data to localStorage
 */

import { logger } from '@/lib/logger'
import { Workout, Exercise, Routine, WorkoutWithSets, RoutineWithExercises } from '@/types'
import { createExportData, exportToJSON } from './export'

const BACKUP_KEY_PREFIX = 'fittrackr_backup_'
const BACKUP_METADATA_KEY = 'fittrackr_backup_metadata'
const MAX_BACKUPS = 10 // Keep last 10 backups
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export interface BackupMetadata {
  lastBackup: string
  backupCount: number
  backups: BackupInfo[]
}

export interface BackupInfo {
  timestamp: string
  key: string
  size: number
  workoutCount: number
  exerciseCount: number
  routineCount: number
}

/**
 * Gets backup metadata from localStorage
 */
function getBackupMetadata(): BackupMetadata {
  try {
    const stored = localStorage.getItem(BACKUP_METADATA_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    logger.error('Error reading backup metadata', error as Error, 'BackupService')
  }
  return {
    lastBackup: '',
    backupCount: 0,
    backups: [],
  }
}

/**
 * Saves backup metadata to localStorage
 */
function saveBackupMetadata(metadata: BackupMetadata): void {
  try {
    localStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(metadata))
  } catch (error) {
    logger.error('Error saving backup metadata', error as Error, 'BackupService')
  }
}

/**
 * Creates a backup of user data
 */
export function createBackup(
  workouts: WorkoutWithSets[],
  exercises: Exercise[],
  routines: RoutineWithExercises[]
): boolean {
  try {
    const exportData = createExportData(workouts, exercises, routines)
    const jsonString = exportToJSON(exportData)
    const timestamp = new Date().toISOString()
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`

    // Save backup
    localStorage.setItem(backupKey, jsonString)

    // Update metadata
    const metadata = getBackupMetadata()
    const backupInfo: BackupInfo = {
      timestamp,
      key: backupKey,
      size: jsonString.length,
      workoutCount: workouts.length,
      exerciseCount: exercises.length,
      routineCount: routines.length,
    }

    metadata.backups.push(backupInfo)
    metadata.lastBackup = timestamp
    metadata.backupCount = metadata.backups.length

    // Keep only last MAX_BACKUPS
    if (metadata.backups.length > MAX_BACKUPS) {
      const oldestBackup = metadata.backups.shift()
      if (oldestBackup) {
        localStorage.removeItem(oldestBackup.key)
      }
    }

    saveBackupMetadata(metadata)
    logger.info(`Backup created: ${backupKey}`, 'BackupService')
    return true
  } catch (error) {
    logger.error('Error creating backup', error as Error, 'BackupService')
    return false
  }
}

/**
 * Gets all available backups
 */
export function getBackups(): BackupInfo[] {
  const metadata = getBackupMetadata()
  return metadata.backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * Restores a backup by timestamp
 */
export function restoreBackup(timestamp: string): string | null {
  try {
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`
    const backupData = localStorage.getItem(backupKey)
    return backupData
  } catch (error) {
    logger.error('Error restoring backup', error as Error, 'BackupService')
    return null
  }
}

/**
 * Deletes a backup
 */
export function deleteBackup(timestamp: string): boolean {
  try {
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`
    localStorage.removeItem(backupKey)

    // Update metadata
    const metadata = getBackupMetadata()
    metadata.backups = metadata.backups.filter((b) => b.timestamp !== timestamp)
    metadata.backupCount = metadata.backups.length
    saveBackupMetadata(metadata)

    logger.info(`Backup deleted: ${backupKey}`, 'BackupService')
    return true
  } catch (error) {
    logger.error('Error deleting backup', error as Error, 'BackupService')
    return false
  }
}

/**
 * Clears all backups
 */
export function clearAllBackups(): boolean {
  try {
    const metadata = getBackupMetadata()
    metadata.backups.forEach((backup) => {
      localStorage.removeItem(backup.key)
    })
    localStorage.removeItem(BACKUP_METADATA_KEY)
    logger.info('All backups cleared', 'BackupService')
    return true
  } catch (error) {
    logger.error('Error clearing backups', error as Error, 'BackupService')
    return false
  }
}

/**
 * Checks if a backup should be created (based on time interval)
 */
export function shouldCreateBackup(): boolean {
  const metadata = getBackupMetadata()
  if (!metadata.lastBackup) {
    return true
  }

  const lastBackupTime = new Date(metadata.lastBackup).getTime()
  const now = Date.now()
  return now - lastBackupTime >= BACKUP_INTERVAL
}

/**
 * Gets the size of all backups in bytes
 */
export function getTotalBackupSize(): number {
  const metadata = getBackupMetadata()
  return metadata.backups.reduce((total, backup) => total + backup.size, 0)
}

/**
 * Auto-backup service that runs periodically
 */
export class AutoBackupService {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  /**
   * Starts the auto-backup service
   */
  start(
    getData: () => Promise<{
      workouts: WorkoutWithSets[]
      exercises: Exercise[]
      routines: RoutineWithExercises[]
    }>
  ): void {
    if (this.isRunning) {
      logger.warn('Auto-backup service is already running', 'AutoBackupService')
      return
    }

    this.isRunning = true
    logger.info('Auto-backup service started', 'AutoBackupService')

    // Check and create backup immediately if needed
    this.checkAndBackup(getData)

    // Set up interval to check periodically
    this.intervalId = setInterval(() => {
      this.checkAndBackup(getData)
    }, BACKUP_INTERVAL)
  }

  /**
   * Stops the auto-backup service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    logger.info('Auto-backup service stopped', 'AutoBackupService')
  }

  /**
   * Checks if backup is needed and creates it
   */
  private async checkAndBackup(
    getData: () => Promise<{
      workouts: WorkoutWithSets[]
      exercises: Exercise[]
      routines: RoutineWithExercises[]
    }>
  ): Promise<void> {
    if (!shouldCreateBackup()) {
      return
    }

    try {
      const data = await getData()
      createBackup(data.workouts, data.exercises, data.routines)
    } catch (error) {
      logger.error('Error in auto-backup', error as Error, 'AutoBackupService')
    }
  }
}

// Singleton instance
export const autoBackupService = new AutoBackupService()

