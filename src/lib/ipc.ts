declare global {
  interface Window {
    playdesk: {
      window: { minimize(): void; maximize(): void; close(): void }
      auth: {
        login(u: string, p: string): Promise<{ success: boolean; user?: any; error?: string }>
        logout(): Promise<{ success: boolean }>
        current(): Promise<any>
      }
      license: {
        status(): Promise<{ activated: boolean; activatedAt?: string; error?: string }>
        activate(key: string): Promise<{ success: boolean; error?: string }>
      }
      stations: {
        list(): Promise<any[]>
        add(name: string): Promise<any>
        update(id: number, data: object): Promise<any>
        remove(id: number): Promise<any>
      }
      sessions: {
        start(data: object): Promise<any>
        end(id: number, note?: string): Promise<any>
        pause(id: number): Promise<any>
        resume(id: number): Promise<any>
        addMatch(id: number): Promise<any>
        active(): Promise<any[]>
        history(filters: object): Promise<any[]>
      }
      dashboard: {
        summary(date: string): Promise<any>
        revenue(period: string): Promise<any[]>
        stationStats(): Promise<any[]>
        peakHours(): Promise<any[]>
        managerActivity(): Promise<any[]>
      }
      users: {
        list(): Promise<any[]>
        create(data: object): Promise<any>
        update(id: number, data: object): Promise<any>
        disable(id: number): Promise<any>
      }
    }
  }
}

export const api = window.playdesk
