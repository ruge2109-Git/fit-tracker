/**
 * Exercise Media Component
 * Displays images, videos, and GIFs for exercises
 */

'use client'

import { useState } from 'react'
import { Image, Video, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog'
import { Exercise } from '@/types'

interface ExerciseMediaProps {
  exercise: Exercise
}

export function ExerciseMedia({ exercise }: ExerciseMediaProps) {
  const [showVideo, setShowVideo] = useState(false)
  const [showImage, setShowImage] = useState(false)

  if (!exercise.image_url && !exercise.video_url && !exercise.demonstration_gif) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* GIF Preview */}
      {exercise.demonstration_gif && (
        <div className="relative rounded-lg overflow-hidden border">
          <img
            src={exercise.demonstration_gif}
            alt={`${exercise.name} demonstration`}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      )}

      {/* Image and Video Thumbnails */}
      <div className="flex gap-2">
        {exercise.image_url && (
          <button
            onClick={() => setShowImage(true)}
            className="relative flex-1 rounded-lg overflow-hidden border hover:opacity-80 transition-opacity group"
          >
            <img
              src={exercise.image_url}
              alt={`${exercise.name} image`}
              className="w-full h-32 object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Image className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        )}

        {exercise.video_url && (
          <button
            onClick={() => setShowVideo(true)}
            className="relative flex-1 rounded-lg overflow-hidden border hover:opacity-80 transition-opacity group"
          >
            <div className="w-full h-32 bg-muted flex items-center justify-center">
              <Video className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={showImage} onOpenChange={setShowImage}>
        <DialogContent className="max-w-4xl w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] p-0 max-h-[90vh]">
          <DialogDescription className="sr-only">
            {exercise.name} image demonstration
          </DialogDescription>
          <div className="relative">
            <img
              src={exercise.image_url}
              alt={`${exercise.name} demonstration`}
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] p-0 max-h-[90vh]">
          <DialogDescription className="sr-only">
            {exercise.name} video demonstration
          </DialogDescription>
          <div className="relative">
            <video
              src={exercise.video_url}
              controls
              className="w-full h-auto max-h-[90vh]"
              autoPlay
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

