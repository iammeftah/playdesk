import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'

export default function UsersSettings() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers]     = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ username: '', password: '', role: 'manager' })
  const [editId, setEditId]   = useState<number | null>(null)
  const [editPass, setEditPass] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => { setUsers(await window.playdesk.users.list()) }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setError('')
    if (!form.username.trim() || !form.password.trim()) { setError('Tous les champs sont requis'); return }
    if (form.password.length < 6) { setError('Mot de passe : 6 caractères minimum'); return }
    setLoading(true)
    const res = await window.playdesk.users.create(form)
    if (res.success) { setShowForm(false); setForm({ username: '', password: '', role: 'manager' }); await load() }
    else setError(res.error ?? 'Erreur création')
    setLoading(false)
  }

  const handleChangePassword = async (id: number) => {
    if (!editPass || editPass.length < 6) { setError('6 caractères minimum'); return }
    setLoading(true)
    await window.playdesk.users.update(id, { password: editPass })
    setEditId(null); setEditPass(''); await load()
    setLoading(false)
  }

  const handleDisable = async (id: number) => {
    if (id === currentUser?.id) { setError('Impossible de désactiver votre propre compte'); return }
    if (!confirm('Désactiver cet utilisateur ?')) return
    await window.playdesk.users.disable(id)
    await load()
  }

  const roleColors: Record<string, string> = {
    admin: 'text-brand-400 bg-brand-900/30',
    manager: 'text-green-400 bg-green-900/30',
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-surface-400 text-sm">Gérez les accès au système.</p>
        <button onClick={() => { setShowForm(!showForm); setError('') }}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-colors">
          {showForm ? 'Annuler' : '+ Nouveau manager'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-surface-900 border border-surface-700 rounded-xl p-5 mb-5 flex flex-col gap-3">
          <h4 className="text-white font-semibold text-sm">Créer un compte</h4>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})}
              placeholder="Nom d'utilisateur"
              className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500" />
            <input value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              type="password" placeholder="Mot de passe (6+ car.)"
              className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500" />
          </div>
          <div className="flex gap-3 items-center">
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500">
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleCreate} disabled={loading}
              className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors">
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="flex flex-col gap-2">
        {users.map(u => (
          <div key={u.id} className={`bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 flex items-center gap-3
            ${!u.active ? 'opacity-50' : ''}`}>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${u.active ? 'bg-green-500' : 'bg-surface-600'}`} />
            <span className="text-white font-medium text-sm flex-1">{u.username}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] ?? 'text-surface-400 bg-surface-800'}`}>
              {u.role}
            </span>
            {u.id === currentUser?.id && (
              <span className="text-xs text-surface-500">(vous)</span>
            )}

            {editId === u.id ? (
              <div className="flex gap-2 items-center">
                <input value={editPass} onChange={e => setEditPass(e.target.value)}
                  type="password" placeholder="Nouveau mot de passe"
                  className="bg-surface-800 border border-brand-500 rounded-lg px-3 py-1 text-white text-xs outline-none w-40" />
                <button onClick={() => handleChangePassword(u.id)}
                  className="text-green-400 hover:text-green-300 text-xs font-medium px-2 py-1">✓</button>
                <button onClick={() => { setEditId(null); setEditPass('') }}
                  className="text-surface-400 hover:text-white text-xs px-2 py-1">✕</button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => { setEditId(u.id); setEditPass(''); setError('') }}
                  className="text-xs text-surface-400 hover:text-white px-2 py-1 rounded hover:bg-surface-800 transition-colors">
                  🔑 MDP
                </button>
                {u.active && u.id !== currentUser?.id && (
                  <button onClick={() => handleDisable(u.id)}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-surface-800 transition-colors">
                    Désactiver
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {error && !showForm && <p className="text-red-400 text-xs mt-3">{error}</p>}
    </div>
  )
}
