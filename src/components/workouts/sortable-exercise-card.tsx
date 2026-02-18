import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface SortableExerciseCardProps {
  id: string
  exerciseName: string
  children: React.ReactNode
  value: string
  className?: string
  onRemove?: () => void
  defaultOpen?: boolean
}

export function SortableExerciseCard({
  id,
  exerciseName,
  children,
  value,
  className,
  onRemove,
  defaultOpen = false,
}: SortableExerciseCardProps) {
  const t = useTranslations('common')
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group bg-accent/5 rounded-[2rem] overflow-hidden transition-all",
        isDragging && "scale-[1.02] shadow-xl z-10 ring-2 ring-primary",
        className
      )}
    >
      <div 
        className="px-5 py-4 flex items-center gap-3 border-b border-border/5 bg-background/40 backdrop-blur-sm cursor-pointer hover:bg-background/60 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-primary transition-colors touch-manipulation p-1 rounded-md hover:bg-background/50"
          aria-label={t('dragToReorder')}
          style={{ touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5" />
        </div>
        
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
            <h3 className="font-bold text-sm leading-tight">
            {exerciseName}
            </h3>
            {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
        </div>

        {onRemove && (
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRemove()
                }}
                className="text-muted-foreground/40 hover:text-destructive transition-colors p-1"
                aria-label={t('remove') || "Remove"}
            >
                <Trash2 className="h-5 w-5" />
            </button>
        )}
      </div>
      
      <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        {children}
      </div>
    </div>
  )
}
