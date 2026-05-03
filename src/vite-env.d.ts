/// <reference types="vite/client" />

interface Window {
  playdesk: {
    window: {
      minimize: () => void
      maximize: () => void
      close:    () => void
    }
    auth: {
      login:   (username: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>
      logout:  () => Promise<{ success: boolean }>
      current: () => Promise<any>
    }
    license: {
      status:     () => Promise<{
        activated:    boolean
        activatedAt?: string
        trial?:       boolean
        expired?:     boolean
        trialEndsAt?: number
        daysLeft?:    number
      }>
      activate:   (key: string) => Promise<{ success: boolean; error?: string }>
      startTrial: () => Promise<{ success: boolean; error?: string }>
    }
    stations: {
      list:   () => Promise<any[]>
      add:    (name: string) => Promise<{ success: boolean; id?: number; name?: string }>
      update: (id: number, data: { name?: string; active?: number }) => Promise<{ success: boolean }>
      remove: (id: number) => Promise<{ success: boolean }>
    }
    sessions: {
      start:    (data: object) => Promise<{ success: boolean; id?: number }>
      end:      (id: number, note?: string) => Promise<{ success: boolean; total?: number; elapsed?: number }>
      pause:    (id: number) => Promise<{ success: boolean }>
      resume:   (id: number) => Promise<{ success: boolean }>
      addMatch: (id: number) => Promise<{ success: boolean; matchCount?: number }>
      active:   () => Promise<any[]>
      history:  (filters: object) => Promise<any[]>
    }
    dashboard: {
      summary:         (date: string) => Promise<any>
      revenue:         (period: string) => Promise<any[]>
      stationStats:    () => Promise<any[]>
      peakHours:       () => Promise<any[]>
      managerActivity: () => Promise<any[]>
    }
    users: {
      list:    () => Promise<any[]>
      create:  (data: { username: string; password: string; role: string }) => Promise<{ success: boolean; id?: number; error?: string }>
      update:  (id: number, data: { username?: string; password?: string; role?: string }) => Promise<{ success: boolean }>
      disable: (id: number) => Promise<{ success: boolean }>
      enable:  (id: number) => Promise<{ success: boolean }>
      delete:  (id: number) => Promise<{ success: boolean }>
    }
  }
}