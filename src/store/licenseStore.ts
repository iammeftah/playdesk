import { create } from 'zustand'

interface LicenseState {
  activated: boolean
  setActivated: (v: boolean) => void
}

export const useLicenseStore = create<LicenseState>((set) => ({
  activated: false,
  setActivated: (activated) => set({ activated }),
}))
