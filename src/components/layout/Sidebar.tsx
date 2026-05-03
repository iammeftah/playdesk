import { Page } from '../../App'

interface Props { page: Page; setPage: (p: Page) => void; userRole: string }

export default function Sidebar({ page, setPage, userRole }: Props) {
  const items = [
    { id: 'caisse' as Page,    label: 'Caisse',     icon: '🎮', roles: ['admin','manager'] },
    { id: 'dashboard' as Page, label: 'Dashboard',  icon: '📊', roles: ['admin'] },
    { id: 'settings' as Page,  label: 'Paramètres', icon: '⚙️', roles: ['admin'] },
  ].filter(i => i.roles.includes(userRole))

  return (
    <aside className="w-52 bg-surface-900 border-r border-surface-800 flex flex-col py-4 gap-1 shrink-0">
      {items.map((item) => (
        <button key={item.id} onClick={() => setPage(item.id)}
          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors mx-2 rounded-lg
            ${page === item.id ? 'bg-brand-600 text-white' : 'text-surface-300 hover:bg-surface-800 hover:text-white'}`}>
          <span className="text-base">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  )
}
