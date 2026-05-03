import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { UserPlus, Key, PowerOff, Power, Check, X, AlertTriangle, Trash2 } from 'lucide-react'

export default function UsersSettings() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers]           = useState<any[]>([])
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ username: '', password: '', role: 'manager' })
  const [formError, setFormError]   = useState('')
  const [editId, setEditId]         = useState<number | null>(null)
  const [editPass, setEditPass]     = useState('')
  const [passError, setPassError]   = useState('')
  const [confirmDisable, setConfirmDisable] = useState<number | null>(null)
  const [confirmEnable, setConfirmEnable]   = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete]   = useState<number | null>(null)
  const [loading, setLoading]       = useState(false)

  const load = async () => { setUsers(await window.playdesk.users.list()) }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setFormError('')
    if (!form.username.trim() || !form.password.trim()) { setFormError('Tous les champs sont requis'); return }
    if (form.password.length < 6) { setFormError('Mot de passe : 6 caractères minimum'); return }
    setLoading(true)
    const res = await window.playdesk.users.create(form)
    if (res.success) {
      setShowForm(false)
      setForm({ username: '', password: '', role: 'manager' })
      await load()
    } else {
      setFormError(res.error ?? 'Erreur création')
    }
    setLoading(false)
  }

  const handleChangePassword = async (id: number) => {
    setPassError('')
    if (!editPass || editPass.length < 6) { setPassError('6 caractères minimum'); return }
    setLoading(true)
    await window.playdesk.users.update(id, { password: editPass })
    setEditId(null)
    setEditPass('')
    setPassError('')
    await load()
    setLoading(false)
  }

  const handleDisable = async (id: number) => {
    setLoading(true)
    await window.playdesk.users.disable(id)
    setConfirmDisable(null)
    await load()
    setLoading(false)
  }

  // FIX: use dedicated enable() instead of update({ active: 1 })
  const handleEnable = async (id: number) => {
    setLoading(true)
    await window.playdesk.users.enable(id)
    setConfirmEnable(null)
    await load()
    setLoading(false)
  }

  // NEW: permanent delete
  const handleDelete = async (id: number) => {
    setLoading(true)
    await window.playdesk.users.delete(id)
    setConfirmDelete(null)
    await load()
    setLoading(false)
  }

  const clearConfirms = () => {
    setConfirmDisable(null)
    setConfirmEnable(null)
    setConfirmDelete(null)
  }

  const rolePill: Record<string, { bg: string; color: string }> = {
    admin:   { bg: 'var(--neon-mid)',      color: 'var(--neon)' },
    manager: { bg: 'rgba(74,222,128,0.1)', color: '#4ade80' },
  }

  const iconBtn = (color: string, bg: string) => ({
    color,
    background: bg,
    border: 'none',
    width: '26px',
    height: '26px',
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.12s ease',
    flexShrink: 0,
  } as React.CSSProperties)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Gérez les accès au système.
        </p>
        <button
          onClick={() => { setShowForm(!showForm); setFormError('') }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
          style={{
            background: showForm ? 'rgba(239,68,68,0.08)' : 'var(--neon-dim)',
            color:      showForm ? '#ef4444' : 'var(--neon)',
            border:     showForm ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          {showForm ? 'Annuler' : 'Nouveau manager'}
        </button>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <div
          className="rounded-xl p-4 mb-4 flex flex-col gap-3"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            Créer un compte
          </h4>
          {formError && (
            <p className="text-xs" style={{ color: '#ef4444' }}>{formError}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
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
          <div className="flex gap-2 items-center">
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
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
              style={{
                background: 'var(--neon-dim)',
                color: 'var(--neon)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </div>
      )}

      {/* ── Users list ── */}
      <div className="flex flex-col gap-2">
        {users.map(u => {
          const isConfirmingDisable = confirmDisable === u.id
          const isConfirmingEnable  = confirmEnable  === u.id
          const isConfirmingDelete  = confirmDelete  === u.id
          const isEditingPass       = editId === u.id
          const anyConfirm          = isConfirmingDisable || isConfirmingEnable || isConfirmingDelete

          return (
            <div
              key={u.id}
              className="flex flex-col rounded-xl overflow-hidden"
              style={{
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                opacity: u.active ? 1 : 0.65,
              }}
            >
              {/* Main row */}
              <div className="px-4 py-2.5 flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                >
                  {u.username[0].toUpperCase()}
                </div>

                <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--foreground)' }}>
                  {u.username}
                </span>

                {/* Role pill */}
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: (rolePill[u.role] ?? { bg: 'var(--border)' }).bg,
                    color:      (rolePill[u.role] ?? { color: 'var(--muted-foreground)' }).color,
                  }}
                >
                  {u.role}
                </span>

                {u.id === currentUser?.id && (
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                    (vous)
                  </span>
                )}

                {/* Disabled badge */}
                {!u.active && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                  >
                    désactivé
                  </span>
                )}

                {/* Inline password edit */}
                {isEditingPass ? (
                  <div className="flex gap-1.5 items-center">
                    <input
                      value={editPass}
                      onChange={e => { setEditPass(e.target.value); setPassError('') }}
                      type="password"
                      placeholder="Nouveau mot de passe"
                      className="settings-input text-xs py-1 w-36"
                      style={{ borderColor: passError ? '#ef4444' : 'var(--neon)' }}
                      autoFocus
                    />
                    <button
                      style={iconBtn('#4ade80', 'rgba(74,222,128,0.1)')}
                      onClick={() => handleChangePassword(u.id)}
                      disabled={loading}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      style={iconBtn('var(--muted-foreground)', 'var(--border)')}
                      onClick={() => { setEditId(null); setEditPass(''); setPassError('') }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  /* Normal action buttons — hidden while a confirm strip is open */
                  !anyConfirm && (
                    <div className="flex gap-1">
                      {/* Change password */}
                      <button
                        style={iconBtn('var(--muted-foreground)', 'transparent')}
                        title="Changer le mot de passe"
                        onClick={() => { setEditId(u.id); setEditPass(''); setPassError('') }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--foreground)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                      >
                        <Key className="w-3 h-3" />
                      </button>

                      {/* Disable — active non-self users only */}
                      {!!u.active && u.id !== currentUser?.id && (
                        <button
                          style={iconBtn('var(--muted-foreground)', 'transparent')}
                          title="Désactiver"
                          onClick={() => { clearConfirms(); setConfirmDisable(u.id) }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                        >
                          <PowerOff className="w-3 h-3" />
                        </button>
                      )}

                      {/* Reactivate — inactive users only */}
                      {!u.active && (
                        <button
                          style={iconBtn('#4ade80', 'rgba(74,222,128,0.08)')}
                          title="Réactiver"
                          onClick={() => { clearConfirms(); setConfirmEnable(u.id) }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.18)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.08)' }}
                        >
                          <Power className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete — non-self users only */}
                      {u.id !== currentUser?.id && (
                        <button
                          style={iconBtn('var(--muted-foreground)', 'transparent')}
                          title="Supprimer définitivement"
                          onClick={() => { clearConfirms(); setConfirmDelete(u.id) }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Password error — attached under the row */}
              {isEditingPass && passError && (
                <div className="px-4 pb-2.5">
                  <p className="text-[11px]" style={{ color: '#ef4444' }}>{passError}</p>
                </div>
              )}

              {/* ── Disable confirm strip ── */}
              {isConfirmingDisable && (
                <div
                  className="px-4 py-2.5 flex items-center gap-3"
                  style={{ borderTop: '1px solid var(--border)', background: 'rgba(239,68,68,0.04)' }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#ef4444' }} />
                  <p className="text-xs flex-1" style={{ color: 'var(--muted-foreground)' }}>
                    Désactiver <strong style={{ color: 'var(--foreground)' }}>{u.username}</strong> ?
                  </p>
                  <button
                    onClick={() => setConfirmDisable(null)}
                    className="px-2.5 py-1 text-xs rounded-md"
                    style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDisable(u.id)}
                    disabled={loading}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md disabled:opacity-40"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    Désactiver
                  </button>
                </div>
              )}

              {/* ── Enable confirm strip ── */}
              {isConfirmingEnable && (
                <div
                  className="px-4 py-2.5 flex items-center gap-3"
                  style={{ borderTop: '1px solid var(--border)', background: 'rgba(74,222,128,0.04)' }}
                >
                  <Power className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ade80' }} />
                  <p className="text-xs flex-1" style={{ color: 'var(--muted-foreground)' }}>
                    Réactiver <strong style={{ color: 'var(--foreground)' }}>{u.username}</strong> ?
                  </p>
                  <button
                    onClick={() => setConfirmEnable(null)}
                    className="px-2.5 py-1 text-xs rounded-md"
                    style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleEnable(u.id)}
                    disabled={loading}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md disabled:opacity-40"
                    style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}
                  >
                    Réactiver
                  </button>
                </div>
              )}

              {/* ── Delete confirm strip ── */}
              {isConfirmingDelete && (
                <div
                  className="px-4 py-2.5 flex items-center gap-3"
                  style={{ borderTop: '1px solid var(--border)', background: 'rgba(239,68,68,0.04)' }}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#ef4444' }} />
                  <p className="text-xs flex-1" style={{ color: 'var(--muted-foreground)' }}>
                    Supprimer <strong style={{ color: 'var(--foreground)' }}>{u.username}</strong> définitivement ?
                  </p>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2.5 py-1 text-xs rounded-md"
                    style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={loading}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md disabled:opacity-40"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}