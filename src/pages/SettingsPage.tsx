import { useState } from 'react'
import StationsSettings from '../components/settings/StationsSettings'
import UsersSettings from '../components/settings/UsersSettings'
import TarifsSettings from '../components/settings/TarifsSettings'
import LicenseSettings from '../components/settings/LicenseSettings'

type Tab = 'stations' | 'users' | 'tarifs' | 'license'

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('stations')

  const tabs = [
    { id: 'stations' as Tab, label: '🖥 Stations' },
    { id: 'users'    as Tab, label: '👤 Utilisateurs' },
    { id: 'tarifs'   as Tab, label: '💰 Tarifs' },
    { id: 'license'  as Tab, label: '🔑 Licence' },
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Paramètres</h2>

      <div className="flex gap-2 mb-6 border-b border-surface-800 pb-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2
              ${tab === t.id ? 'text-white border-brand-500 bg-surface-900' : 'text-surface-400 border-transparent hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stations' && <StationsSettings />}
      {tab === 'users'    && <UsersSettings />}
      {tab === 'tarifs'   && <TarifsSettings />}
      {tab === 'license'  && <LicenseSettings />}
    </div>
  )
}
