import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { UserPlus, Key, PowerOff, Check, X } from 'lucide-react'

export default function UsersSettings() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers]       = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ username: '', password: '', role: 'manager' })
  const [editId, setEditId]     = useState<number | null>(null)
  const [editPass, setEditPass] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const load = async () => { setUsers(await window.playdesk.users.list()) }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setError('')
    if (!form.username.trim() || !form.password.trim()) { setError('Tous les champs sont requis'); return }
    if (form.password.length < 6) { setError('Mot de passe : 6 caractères minimum'); return }
    setLoading(true)
    const res = await window.playdesk.users.create(form)
    if (res.success) {
      setShowForm(false)
      setForm({ username: '', password: '', role: 'manager' })
      await load()
    } else {
      setError(res.error ?? 'Erreur création')
    }
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

  const rolePill: Record<string, { bg: string; color: string }> = {
    admin:   { bg: 'var(--neon-mid)',              color: 'var(--neon)' },
    manager: { bg: 'rgba(74,222,128,0.1)',          color: '#4ade80' },
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Gérez les accès au système.
        </p>
        <button
          onClick={() => { setShowForm(!showForm); setError('') }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? 'Annuler' : 'Nouveau manager'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-xl p-5 mb-5 flex flex-col gap-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Créer un compte
          </h4>
          {error && (
            <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Nom d'utilisateur"
              className="settings-input"
            />
            <input
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              type="password"
              placeholder="Mot de passe (6+ car.)"
              className="settings-input"
            />
          </div>
          <div className="flex gap-3 items-center">
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="settings-input"
            >
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="flex flex-col gap-2">
        {users.map(u => (
          <div
            key={u.id}
            className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              opacity: u.active ? 1 : 0.5,
            }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              {u.username[0].toUpperCase()}
            </div>

            <span className="text-sm font-medium flex-1" style={{ color: 'var(--foreground)' }}>
              {u.username}
            </span>

            {/* Role pill */}
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: (rolePill[u.role] ?? { bg: 'var(--muted)' }).bg,
                color: (rolePill[u.role] ?? { color: 'var(--muted-foreground)' }).color,
              }}
            >
              {u.role}
            </span>

            {u.id === currentUser?.id && (
              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                (vous)
              </span>
            )}

            {/* Password edit inline */}
            {editId === u.id ? (
              <div className="flex gap-2 items-center">
                <input
                  value={editPass}
                  onChange={e => setEditPass(e.target.value)}
                  type="password"
                  placeholder="Nouveau mot de passe"
                  className="settings-input text-xs py-1 w-40"
                  style={{ borderColor: 'var(--neon)' }}
                />
                <button
                  onClick={() => handleChangePassword(u.id)}
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)' }}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setEditId(null); setEditPass('') }}
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditId(u.id); setEditPass(''); setError('') }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  title="Changer le mot de passe"
                  style={{ color: 'var(--muted-foreground)', background: 'transparent' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--foreground)'
                    e.currentTarget.style.background = 'var(--muted)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--muted-foreground)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Key className="w-3.5 h-3.5" />
                </button>
                {u.active && u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDisable(u.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    title="Désactiver"
                    style={{ color: 'var(--muted-foreground)', background: 'transparent' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#ef4444'
                      e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--muted-foreground)'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && !showForm && (
        <p className="text-xs mt-3" style={{ color: '#ef4444' }}>{error}</p>
      )}
    </div>
  )
}