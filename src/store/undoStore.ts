import { create } from 'zustand'

export type UndoAction = {
  id: string
  label: string          // e.g. "Session terminée · PS5-2"
  description?: string   // e.g. "120.00 MAD"
  timeoutMs: number      // how long before auto-dismiss
  expiresAt: number      // Date.now() + timeoutMs
  onUndo: () => Promise<void>
}

interface UndoState {
  actions: UndoAction[]
  push: (action: Omit<UndoAction, 'id' | 'expiresAt'>) => string
  remove: (id: string) => void
  clear: () => void
}

export const useUndoStore = create<UndoState>((set) => ({
  actions: [],

  push: (action) => {
    const id = Math.random().toString(36).slice(2)
    const expiresAt = Date.now() + action.timeoutMs
    set(s => ({ actions: [...s.actions, { ...action, id, expiresAt }] }))
    return id
  },

  remove: (id) => set(s => ({ actions: s.actions.filter(a => a.id !== id) })),

  clear: () => set({ actions: [] }),
}))