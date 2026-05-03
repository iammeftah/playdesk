import { create } from 'zustand'
import { Station } from '../types'

interface StationState {
  stations: Station[]
  setStations: (s: Station[]) => void
}

export const useStationStore = create<StationState>((set) => ({
  stations: [],
  setStations: (stations) => set({ stations }),
}))
