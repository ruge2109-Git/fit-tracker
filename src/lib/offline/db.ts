/**
 * IndexedDB Database for Offline Support
 * Stores workouts, routines, exercises for offline access
 */

import { Workout, Routine, Exercise } from '@/types'
import { generateId } from '@/lib/utils'

const DB_NAME = 'fittrackr-db'
const DB_VERSION = 2

interface DBSchema {
  workouts: Workout[]
  routines: Routine[]
  exercises: Exercise[]
  sets: any[]
  tags: any[]
  body_measurements: any[]
  goals: any[]
  progress_photos: any[]
  audit_logs: any[]
  feedback: any[]
  push_subscriptions: any[]
  saved_filters: any[]
  workout_tags: any[]
  syncQueue: SyncItem[]
}

interface SyncItem {
  id: string
  type: 
    | 'workout' 
    | 'routine' 
    | 'exercise' 
    | 'set' 
    | 'tag' 
    | 'body_measurement' 
    | 'goal' 
    | 'progress_photo' 
    | 'audit_log' 
    | 'feedback' 
    | 'push_subscription' 
    | 'saved_filter' 
    | 'workout_tag'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retryCount?: number
  localUpdatedAt?: string
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

        // Sets store
        if (!db.objectStoreNames.contains('sets')) {
          const setStore = db.createObjectStore('sets', { keyPath: 'id' })
          setStore.createIndex('workout_id', 'workout_id', { unique: false })
          setStore.createIndex('exercise_id', 'exercise_id', { unique: false })
        }

        // Tags store
        if (!db.objectStoreNames.contains('tags')) {
          const tagStore = db.createObjectStore('tags', { keyPath: 'id' })
          tagStore.createIndex('user_id', 'user_id', { unique: false })
        }

        // Body Measurements store
        if (!db.objectStoreNames.contains('body_measurements')) {
          const measurementStore = db.createObjectStore('body_measurements', { keyPath: 'id' })
          measurementStore.createIndex('user_id', 'user_id', { unique: false })
          measurementStore.createIndex('measurement_type', 'measurement_type', { unique: false })
        }

        // Goals store
        if (!db.objectStoreNames.contains('goals')) {
          const goalStore = db.createObjectStore('goals', { keyPath: 'id' })
          goalStore.createIndex('user_id', 'user_id', { unique: false })
        }

        // Progress Photos store
        if (!db.objectStoreNames.contains('progress_photos')) {
          const photoStore = db.createObjectStore('progress_photos', { keyPath: 'id' })
          photoStore.createIndex('user_id', 'user_id', { unique: false })
        }

        // Audit Logs store
        if (!db.objectStoreNames.contains('audit_logs')) {
          const logStore = db.createObjectStore('audit_logs', { keyPath: 'id' })
          logStore.createIndex('user_id', 'user_id', { unique: false })
        }

        // Feedback store
        if (!db.objectStoreNames.contains('feedback')) {
          const feedbackStore = db.createObjectStore('feedback', { keyPath: 'id' })
          feedbackStore.createIndex('user_id', 'user_id', { unique: false })
        }

        // Push Subscriptions store
        if (!db.objectStoreNames.contains('push_subscriptions')) {
          const pushStore = db.createObjectStore('push_subscriptions', { keyPath: 'id' })
          pushStore.createIndex('user_id', 'user_id', { unique: false })
        }

        // Saved Filters store
        if (!db.objectStoreNames.contains('saved_filters')) {
          const filterStore = db.createObjectStore('saved_filters', { keyPath: 'id' })
          filterStore.createIndex('user_id', 'user_id', { unique: false })
        }

        // Workout Tags store
        if (!db.objectStoreNames.contains('workout_tags')) {
          const workoutTagStore = db.createObjectStore('workout_tags', { keyPath: 'id' })
          workoutTagStore.createIndex('workout_id', 'workout_id', { unique: false })
          workoutTagStore.createIndex('tag_id', 'tag_id', { unique: false })
        }

        // Goal Progress store
        if (!db.objectStoreNames.contains('goal_progress')) {
          const progressStore = db.createObjectStore('goal_progress', { keyPath: 'id' })
          progressStore.createIndex('goal_id', 'goal_id', { unique: false })
        }

        // Routine Exercises store
        if (!db.objectStoreNames.contains('routine_exercises')) {
          const reStore = db.createObjectStore('routine_exercises', { keyPath: 'id' })
          reStore.createIndex('routine_id', 'routine_id', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // Generic Entity Methods
  async saveEntity<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.put(data)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      } catch (error) {
        reject(error)
      }
    })
  }

  async getEntity<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.get(id)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      } catch (error) {
        reject(error)
      }
    })
  }

  async getAllEntities<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      } catch (error) {
        reject(error)
      }
    })
  }

  async deleteEntity(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.delete(id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      } catch (error) {
        reject(error)
      }
    })
  }

  async getEntitiesByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const index = store.index(indexName)
        const request = index.getAll(value)
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Sync Queue
  async addToSyncQueue(item: Omit<SyncItem, 'id' | 'timestamp'> & { localUpdatedAt?: string }): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const syncItem: SyncItem = {
        ...item,
        id: generateId(),
        timestamp: Date.now(),
        retryCount: 0,
      }
      const request = store.add(syncItem)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async incrementRetry(itemId: string): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const getRequest = store.get(itemId)
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          item.retryCount = (item.retryCount || 0) + 1
          store.put(item)
        }
        resolve()
      }
      getRequest.onerror = () => reject(getRequest.error)
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
