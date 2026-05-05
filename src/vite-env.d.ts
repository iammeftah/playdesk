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
        activated:              boolean
        activatedAt?:           string
        subscriptionExpiresAt?: string
        subscriptionExpired?:   boolean
        trial?:                 boolean
        expired?:               boolean
        trialEndsAt?:           number
        daysLeft?:              number
      }>
      activate:   (key: string) => Promise<{ success: boolean; expiresAt?: string; error?: string }>
      startTrial: () => Promise<{ success: boolean; error?: string }>
    }

    stations: {
      list:   () => Promise<any[]>
      add:    (name: string) => Promise<{ success: boolean; id?: number; name?: string }>
      update: (id: number, data: { name?: string; active?: number }) => Promise<{ success: boolean }>
      remove: (id: number) => Promise<{ success: boolean }>
    }

    sessions: {
      start:        (data: object) => Promise<{ success: boolean; id?: number }>
      end:          (id: number, note?: string) => Promise<{ success: boolean; total?: number; elapsed?: number }>
      extend:       (id: number, extraMinutes: number) => Promise<{ success: boolean; newPrepaidMinutes?: number; error?: string }>
      transfer:     (sessionId: number, targetStationId: number) => Promise<{ success: boolean; error?: string }>
      undoEnd:      (id: number) => Promise<{ success: boolean; error?: string }>
      undoAddMatch: (id: number, previousCount: number) => Promise<{ success: boolean; matchCount?: number; error?: string }>
      pause:        (id: number) => Promise<{ success: boolean }>
      resume:       (id: number) => Promise<{ success: boolean }>
      addMatch:     (id: number) => Promise<{ success: boolean; matchCount?: number }>
      active:       () => Promise<any[]>
      history:      (filters: object) => Promise<any[]>
    }

    shifts: {
      open:    (managerId: number) => Promise<{ success: boolean; id?: number; alreadyOpen?: boolean }>
      pause:   (managerId: number) => Promise<{ success: boolean; error?: string }>
      resume:  (managerId: number) => Promise<{ success: boolean; error?: string }>
      close:   (managerId: number) => Promise<{ success: boolean; revenue?: number; sessionCount?: number; error?: string }>
      current: (managerId: number) => Promise<{
        id:               number
        manager_id:       number
        username:         string
        opened_at:        string
        opened_at_unix:   number
        closed_at?:       string
        closed_at_unix?:  number
        paused_at_unix?:  number
        paused_duration?: number
        status:           'open' | 'paused' | 'closed'
        total_revenue?:   number
        session_count?:   number
      } | null>
      history:    (filters?: { managerId?: number; date?: string }) => Promise<any[]>
      todayTotal: () => Promise<any[]>
    }

    dashboard: {
      summary:         (date: string) => Promise<any>
      revenue:         (period: string) => Promise<any[]>
      stationStats:    () => Promise<any[]>
      peakHours:       () => Promise<any[]>
      managerActivity: () => Promise<any[]>
      weekComparison:  () => Promise<{
        thisWeek: { revenue: number; sessions: number; days: any[] }
        lastWeek: { revenue: number; sessions: number; days: any[] }
        diff:     { revenue: number; revenuePct: number; sessions: number; sessionsPct: number }
      }>
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