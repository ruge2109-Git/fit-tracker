/**
 * Storage Utilities
 * Helper functions for working with Supabase Storage
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

const STORAGE_BUCKET = 'progress-photos'
const SIGNED_URL_EXPIRATION = 3600 // 1 hour

/**
 * Get signed URL for a private storage file
 * @param path - The file path in storage (e.g., "userId/timestamp-random.ext")
 * @returns Signed URL or null if error
 */
export async function getSignedUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRATION)

    if (error) {
      logger.error('Error creating signed URL:', error as Error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    logger.error('Error creating signed URL:', error as Error)
    return null
  }
}

/**
 * Get signed URL for multiple files
 * @param paths - Array of file paths
 * @returns Map of path to signed URL
 */
export async function getSignedUrls(paths: string[]): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>()
  
  await Promise.all(
    paths.map(async (path) => {
      const url = await getSignedUrl(path)
      if (url) {
        urlMap.set(path, url)
      }
    })
  )

  return urlMap
}

