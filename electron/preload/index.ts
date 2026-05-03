import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('playdesk', {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close:    () => ipcRenderer.send('window:close'),
  },
  auth: {
    login:   (u: string, p: string) => ipcRenderer.invoke('auth:login', u, p),
    logout:  () => ipcRenderer.invoke('auth:logout'),
    current: () => ipcRenderer.invoke('auth:current'),
  },
  license: {
    status:   () => ipcRenderer.invoke('license:status'),
    activate: (key: string) => ipcRenderer.invoke('license:activate', key),
  },
  stations: {
    list:   () => ipcRenderer.invoke('stations:list'),
    add:    (name: string) => ipcRenderer.invoke('stations:add', name),
    update: (id: number, data: object) => ipcRenderer.invoke('stations:update', id, data),
    remove: (id: number) => ipcRenderer.invoke('stations:remove', id),
  },
  sessions: {
    start:    (data: object) => ipcRenderer.invoke('sessions:start', data),
    end:      (id: number, note?: string) => ipcRenderer.invoke('sessions:end', id, note),
    pause:    (id: number) => ipcRenderer.invoke('sessions:pause', id),
    resume:   (id: number) => ipcRenderer.invoke('sessions:resume', id),
    addMatch: (id: number) => ipcRenderer.invoke('sessions:addMatch', id),
    active:   () => ipcRenderer.invoke('sessions:active'),
    history:  (f: object) => ipcRenderer.invoke('sessions:history', f),
  },
  dashboard: {
    summary:         (date: string) => ipcRenderer.invoke('dashboard:summary', date),
    revenue:         (period: string) => ipcRenderer.invoke('dashboard:revenue', period),
    stationStats:    () => ipcRenderer.invoke('dashboard:stationStats'),
    peakHours:       () => ipcRenderer.invoke('dashboard:peakHours'),
    managerActivity: () => ipcRenderer.invoke('dashboard:managerActivity'),
  },
  users: {
    list:    () => ipcRenderer.invoke('users:list'),
    create:  (data: object) => ipcRenderer.invoke('users:create', data),
    update:  (id: number, data: object) => ipcRenderer.invoke('users:update', id, data),
    disable: (id: number) => ipcRenderer.invoke('users:disable', id),
  },
})
