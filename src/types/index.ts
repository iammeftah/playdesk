export type Role = 'admin' | 'manager'
export type SessionType = 'match' | 'temps' | 'libre'
export type SessionStatus = 'active' | 'paused' | 'ended'
export type StationStatus = 'libre' | 'active' | 'pause' | 'expired'

export interface User {
  id: number
  username: string
  role: Role
  active: number
  created_at: string
}

export interface Station {
  id: number
  name: string
  active: number
  created_at: string
}

export interface Session {
  id: number
  station_id: number
  manager_id: number
  type: SessionType
  status: SessionStatus
  started_at: string
  started_at_unix: number
  ended_at?: string
  ended_at_unix?: number
  paused_duration: number
  paused_at?: string
  paused_at_unix?: number
  match_count: number
  match_duration?: number
  prepaid_minutes?: number
  total_amount?: number
  note?: string
  station_name?: string
  manager_name?: string
}
