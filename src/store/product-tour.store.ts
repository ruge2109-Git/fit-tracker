/**
 * Signals that the product tour should start (after onboarding modal, or replay from profile).
 */

import { create } from 'zustand'

interface ProductTourState {
  pendingTourStart: boolean
  requestTourStart: () => void
  consumePendingTourStart: () => boolean
}

export const useProductTourStore = create<ProductTourState>((set, get) => ({
  pendingTourStart: false,

  requestTourStart: () => set({ pendingTourStart: true }),

  consumePendingTourStart: () => {
    if (!get().pendingTourStart) return false
    set({ pendingTourStart: false })
    return true
  },
}))
