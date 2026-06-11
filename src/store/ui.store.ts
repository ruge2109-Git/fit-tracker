/**
 * UI Store
 * Global state for UI components (modals, dialogs, toasts)
 */

import { create } from 'zustand'

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

interface ImportModalState {
  isOpen: boolean
  type?: 'workouts' | 'exercises' | 'routines'
  onClose: () => void
}

interface UIStore {
  // Confirm Dialog
  confirmDialog: ConfirmDialogState
  openConfirmDialog: (config: Omit<ConfirmDialogState, 'isOpen'>) => void
  closeConfirmDialog: () => void

  // Import Modal
  importModal: ImportModalState
  openImportModal: (type: ImportModalState['type']) => void
  closeImportModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  },
  openConfirmDialog: (config) =>
    set({
      confirmDialog: {
        isOpen: true,
        ...config,
      },
    }),
  closeConfirmDialog: () =>
    set((state) => ({
      confirmDialog: {
        ...state.confirmDialog,
        isOpen: false,
      },
    })),

  importModal: {
    isOpen: false,
    onClose: () => {},
  },
  openImportModal: (type) =>
    set({
      importModal: {
        isOpen: true,
        type,
        onClose: () => {},
      },
    }),
  closeImportModal: () =>
    set((state) => ({
      importModal: {
        ...state.importModal,
        isOpen: false,
      },
    })),
}))
