'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

interface SortableExerciseGroupProps {
  id: string
  exerciseName: string
  children: React.ReactNode
  value: string
}

export function SortableExerciseGroup({
  id,
  exerciseName,
  children,
  value,
}: SortableExerciseGroupProps) {
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
    <div ref={setNodeRef} style={style}>
      <AccordionItem value={value} className={isDragging ? 'ring-2 ring-primary rounded-lg' : ''}>
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Drag to reorder"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <span className="font-semibold">{exerciseName}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {children}
        </AccordionContent>
      </AccordionItem>
    </div>
  )
}

