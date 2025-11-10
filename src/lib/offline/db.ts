/**
 * IndexedDB Database for Offline Support
 * Stores workouts, routines, exercises for offline access
 */

import { Workout, Routine, Exercise } from '@/types'

const DB_NAME = 'fittrackr-db'
const DB_VERSION = 1

interface DBSchema {
  workouts: Workout[]
  routines: Routine[]
  exercises: Exercise[]
  syncQueue: SyncItem[]
}

interface SyncItem {
  id: string
  type: 'workout' | 'routine' | 'exercise'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

class OfflineDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Workouts store
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' })
          workoutStore.createIndex('date', 'date', { unique: false })
          workoutStore.createIndex('user_id', 'user_id', { unique: false })
        }

        // Routines store
        if (!db.objectStoreNames.contains('routines')) {
          const routineStore = db.createObjectStore('routines', { keyPath: 'id' })
          routineStore.createIndex('user_id', 'user_id', { unique: false })
          routineStore.createIndex('is_active', 'is_active', { unique: false })
        }

        // Exercises store
        if (!db.objectStoreNames.contains('exercises')) {
          db.createObjectStore('exercises', { keyPath: 'id' })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // Workouts
  async saveWorkout(workout: Workout): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workouts'], 'readwrite')
      const store = transaction.objectStore('workouts')
      const request = store.put(workout)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getWorkouts(userId: string): Promise<Workout[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workouts'], 'readonly')
      const store = transaction.objectStore('workouts')
      const index = store.index('user_id')
      const request = index.getAll(userId)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteWorkout(id: string): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workouts'], 'readwrite')
      const store = transaction.objectStore('workouts')
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Routines
  async saveRoutine(routine: Routine): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['routines'], 'readwrite')
      const store = transaction.objectStore('routines')
      const request = store.put(routine)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getRoutines(userId: string): Promise<Routine[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['routines'], 'readonly')
      const store = transaction.objectStore('routines')
      const index = store.index('user_id')
      const request = index.getAll(userId)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteRoutine(id: string): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['routines'], 'readwrite')
      const store = transaction.objectStore('routines')
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Exercises
  async saveExercises(exercises: Exercise[]): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['exercises'], 'readwrite')
      const store = transaction.objectStore('exercises')
      const promises = exercises.map(ex => {
        return new Promise<void>((res, rej) => {
          const req = store.put(ex)
          req.onsuccess = () => res()
          req.onerror = () => rej(req.error)
        })
      })
      Promise.all(promises).then(() => resolve()).catch(reject)
    })
  }

  async getExercises(): Promise<Exercise[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['exercises'], 'readonly')
      const store = transaction.objectStore('exercises')
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Sync Queue
  async addToSyncQueue(item: Omit<SyncItem, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const syncItem: SyncItem = {
        ...item,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      }
      const request = store.add(syncItem)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncQueue(): Promise<SyncItem[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly')
      const store = transaction.objectStore('syncQueue')
      const index = store.index('timestamp')
      const request = index.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineDB = new OfflineDB()
export type { SyncItem }

