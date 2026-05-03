import { create } from 'zustand'
import { Session } from '../types'

interface SessionState {
  activeSessions: Session[]
  setActiveSessions: (s: Session[]) => void
  updateSession: (id: number, data: Partial<Session>) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessions: [],
  setActiveSessions: (activeSessions) => set({ activeSessions }),
  updateSession: (id, data) => set((state) => ({
    activeSessions: state.activeSessions.map((s) => s.id === id ? { ...s, ...data } : s)
  })),
}))
