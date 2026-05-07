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
    status:     () => ipcRenderer.invoke('license:status'),
    activate:   (key: string) => ipcRenderer.invoke('license:activate', key),
    startTrial: () => ipcRenderer.invoke('license:startTrial'),
  },
  stations: {
    list:   () => ipcRenderer.invoke('stations:list'),
    add:    (name: string) => ipcRenderer.invoke('stations:add', name),
    update: (id: number, data: object) => ipcRenderer.invoke('stations:update', id, data),
    remove: (id: number) => ipcRenderer.invoke('stations:remove', id),
  },
  sessions: {
    start:        (data: object) => ipcRenderer.invoke('sessions:start', data),
    end:          (id: number, note?: string) => ipcRenderer.invoke('sessions:end', id, note),
    extend:       (id: number, extraMinutes: number) => ipcRenderer.invoke('sessions:extend', id, extraMinutes),
    transfer:     (sessionId: number, targetStationId: number) => ipcRenderer.invoke('sessions:transfer', sessionId, targetStationId),
    undoEnd:      (id: number) => ipcRenderer.invoke('sessions:undoEnd', id),
    undoAddMatch: (id: number, previousCount: number) => ipcRenderer.invoke('sessions:undoAddMatch', id, previousCount),
    pause:        (id: number) => ipcRenderer.invoke('sessions:pause', id),
    resume:       (id: number) => ipcRenderer.invoke('sessions:resume', id),
    addMatch:     (id: number) => ipcRenderer.invoke('sessions:addMatch', id),
    active:       () => ipcRenderer.invoke('sessions:active'),
    history:      (f: object) => ipcRenderer.invoke('sessions:history', f),
  },
  shifts: {
    open:       (managerId: number) => ipcRenderer.invoke('shifts:open', managerId),
    pause:      (managerId: number) => ipcRenderer.invoke('shifts:pause', managerId),
    resume:     (managerId: number) => ipcRenderer.invoke('shifts:resume', managerId),
    close:      (managerId: number) => ipcRenderer.invoke('shifts:close', managerId),
    current:    (managerId: number) => ipcRenderer.invoke('shifts:current', managerId),
    history:    (filters?: object) => ipcRenderer.invoke('shifts:history', filters),
    todayTotal: () => ipcRenderer.invoke('shifts:todayTotal'),
  },
  dashboard: {
    summary:         (date: string) => ipcRenderer.invoke('dashboard:summary', date),
    revenue:         (period: string) => ipcRenderer.invoke('dashboard:revenue', period),
    stationStats:    () => ipcRenderer.invoke('dashboard:stationStats'),
    peakHours:       () => ipcRenderer.invoke('dashboard:peakHours'),
    managerActivity: () => ipcRenderer.invoke('dashboard:managerActivity'),
    weekComparison:  () => ipcRenderer.invoke('dashboard:weekComparison'),
  },
  users: {
    list:           () => ipcRenderer.invoke('users:list'),
    create:         (data: object) => ipcRenderer.invoke('users:create', data),
    update:         (id: number, data: object) => ipcRenderer.invoke('users:update', id, data),
    disable:        (id: number) => ipcRenderer.invoke('users:disable', id),
    enable:         (id: number) => ipcRenderer.invoke('users:enable', id),
    delete:         (id: number) => ipcRenderer.invoke('users:delete', id),
    changePassword: (data: object) => ipcRenderer.invoke('users:changePassword', data),
    getAvatar:      (id: number) => ipcRenderer.invoke('users:getAvatar', id),
    setAvatar:      (id: number, base64: string) => ipcRenderer.invoke('users:setAvatar', id, base64),
  },

  danger: {
    exportCsv:   () => ipcRenderer.invoke('danger:exportCsv'),
    exportExcel: () => ipcRenderer.invoke('danger:exportExcel'),
    resetDb:     () => ipcRenderer.invoke('danger:resetDb'),
    relaunch:    () => ipcRenderer.invoke('danger:relaunch'),
  },
})