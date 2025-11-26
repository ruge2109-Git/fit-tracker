/**
 * PhotoImage Component
 * Displays a progress photo with automatic signed URL generation for private buckets
 */

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getSignedUrl } from '@/lib/utils/storage'
import { Skeleton } from '@/components/ui/loading-skeleton'

interface PhotoImageProps {
  photoUrl: string // Can be a path or full URL
  alt: string
  fill?: boolean
  className?: string
  onClick?: () => void
  width?: number
  height?: number
  sizes?: string // Required when using fill for Next.js Image optimization
  priority?: boolean // For LCP optimization
}

export function PhotoImage({ photoUrl, alt, fill, className, onClick, width, height, sizes, priority }: PhotoImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState(true)

  useEffect(() => {
    // Reset loading states when photoUrl changes
    setIsLoading(true)
    setImageLoading(true)

    // If photoUrl is already a full URL (starts with http), use it directly
    if (photoUrl.startsWith('http')) {
      setSignedUrl(photoUrl)
      setIsLoading(false)
      return
    }

    // Otherwise, it's a path - generate signed URL
    const loadSignedUrl = async () => {
      const url = await getSignedUrl(photoUrl)
      setSignedUrl(url)
      setIsLoading(false)
    }

    loadSignedUrl()
  }, [photoUrl])

  const showSkeleton = isLoading || !signedUrl || imageLoading

  if (fill) {
    return (
      <>
        {showSkeleton && (
          <Skeleton className="absolute inset-0 z-10" />
        )}
        {signedUrl && (
          <Image
            src={signedUrl}
            alt={alt}
            fill
            sizes={sizes || '(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12.5vw'}
            className={`${className || ''} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onClick={onClick}
            priority={priority}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="relative" style={{ width: width || 400, height: height || 600 }}>
      {showSkeleton && (
        <Skeleton className="absolute inset-0 z-10" />
      )}
      {signedUrl && (
        <Image
          src={signedUrl}
          alt={alt}
          width={width || 400}
          height={height || 600}
          className={`${className || ''} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 relative z-0`}
          onClick={onClick}
          priority={priority}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
      )}
    </div>
  )
}

