import { create } from 'zustand'

interface AiCoachStore {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

export const useAiCoachStore = create<AiCoachStore>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
