'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui.store'

export function ConfirmDialog() {
  const { confirmDialog, closeConfirmDialog } = useUIStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await confirmDialog.onConfirm()
    } finally {
      setIsLoading(false)
      closeConfirmDialog()
    }
  }

  const handleCancel = () => {
    confirmDialog.onCancel?.()
    closeConfirmDialog()
  }

  return (
    <Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirmDialog.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm">{confirmDialog.message}</div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            {confirmDialog.cancelText || 'Cancel'}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={confirmDialog.isDangerous ? 'destructive' : 'default'}
          >
            {isLoading ? 'Processing...' : confirmDialog.confirmText || 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
