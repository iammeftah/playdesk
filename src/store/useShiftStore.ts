import { create } from 'zustand'
import type { Shift } from '../components/shift/ShiftPanel'

interface ShiftStore {
  activeShift: Shift | null
  setActiveShift: (shift: Shift | null) => void
}

export const useShiftStore = create<ShiftStore>((set) => ({
  activeShift:    null,
  setActiveShift: (shift) => set({ activeShift: shift }),
}))