import { create } from 'zustand'

type LicenseState = {
  activated:    boolean
  trial:        boolean
  expired:      boolean
  daysLeft:     number
  trialEndsAt:  number | null

  setStatus: (s: {
    activated:    boolean
    trial?:       boolean
    expired?:     boolean
    daysLeft?:    number
    trialEndsAt?: number
  }) => void
}

export const useLicenseStore = create<LicenseState>((set) => ({
  activated:   false,
  trial:       false,
  expired:     false,
  daysLeft:    0,
  trialEndsAt: null,

  setStatus: (s) => set({
    activated:   s.activated        ?? false,
    trial:       s.trial            ?? false,
    expired:     s.expired          ?? false,
    daysLeft:    s.daysLeft         ?? 0,
    trialEndsAt: s.trialEndsAt      ?? null,
  }),
}))