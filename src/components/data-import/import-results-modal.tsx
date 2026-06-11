'use client'

import { ImportResult } from '@/lib/data/import'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ImportResultsModalProps {
  isOpen: boolean
  result: ImportResult | null
  onClose: () => void
  onRetry?: () => void
}

export function ImportResultsModal({
  isOpen,
  result,
  onClose,
  onRetry,
}: ImportResultsModalProps) {
  if (!result) return null

  const hasErrors = result.errors && result.errors.length > 0
  const hasWarnings = result.warnings && result.warnings.length > 0
  const stats = result.stats

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result.success ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Import Successful
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                Import Failed
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {stats && (
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <div className="font-semibold text-foreground">
                    {stats.workoutsImported}
                  </div>
                  <div className="text-muted-foreground">Workouts imported</div>
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {stats.exercisesImported}
                  </div>
                  <div className="text-muted-foreground">Exercises imported</div>
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {stats.routinesImported}
                  </div>
                  <div className="text-muted-foreground">Routines imported</div>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96">
          {hasErrors && result.errors && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-semibold text-red-600">
                <AlertCircle className="w-4 h-4" />
                Errors ({result.errors.length})
              </h3>
              <ScrollArea className="h-32 border rounded-lg p-3">
                <div className="space-y-1 text-sm">
                  {result.errors.map((error, idx) => (
                    <div key={idx} className="text-red-600 break-words">
                      • {error}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {hasWarnings && result.warnings && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 font-semibold text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                Warnings ({result.warnings.length})
              </h3>
              <ScrollArea className="h-32 border rounded-lg p-3">
                <div className="space-y-1 text-sm">
                  {result.warnings.map((warning, idx) => (
                    <div key={idx} className="text-amber-600 break-words">
                      • {warning}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {!hasErrors && !hasWarnings && result.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              All data imported successfully!
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          {!result.success && onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try Again
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
