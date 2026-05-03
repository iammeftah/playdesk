import { useEffect, useState } from 'react'
import { Plus, Pencil, Power, Trash2, Check, X } from 'lucide-react'

export default function StationsSettings() {
  const [stations, setStations] = useState<any[]>([])
  const [newName, setNewName]   = useState('')
  const [editId, setEditId]     = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading]   = useState(false)

  const load = async () => { setStations(await window.playdesk.stations.list()) }
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    await window.playdesk.stations.add(newName.trim())
    setNewName('')
    await load()
    setLoading(false)
  }

  const handleRename = async (id: number) => {
    if (!editName.trim()) return
    await window.playdesk.stations.update(id, { name: editName.trim() })
    setEditId(null)
    await load()
  }

  const handleToggle = async (id: number, active: number) => {
    await window.playdesk.stations.update(id, { active: active ? 0 : 1 })
    await load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette station ?')) return
    await window.playdesk.stations.remove(id)
    await load()
  }

  // Shared icon-button style
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
    transition: 'opacity 0.15s ease',
    flexShrink: 0,
  } as React.CSSProperties)

  return (
    <div className="w-full">
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Gérez vos stations PS5. Les stations désactivées n'apparaissent pas en Caisse.
      </p>

      {/* Add form */}
      <div className="flex gap-2 mb-5">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nom de la station (ex: PS5-5)"
          className="settings-input flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newName.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
          style={{
            background: 'var(--neon-dim)',
            color: 'var(--neon)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {/* Station list */}
      <div className="flex flex-col gap-2">
        {stations.map(s => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all"
            style={{
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              opacity: s.active ? 1 : 0.55,
            }}
          >
            {/* Status dot */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: s.active ? '#4ade80' : 'var(--muted-foreground)',
                boxShadow: s.active ? '0 0 5px rgba(74,222,128,0.6)' : 'none',
              }}
            />

            {/* Name / edit input */}
            {editId === s.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleRename(s.id)
                  if (e.key === 'Escape') setEditId(null)
                }}
                className="settings-input flex-1 py-1 text-sm"
                style={{ borderColor: 'var(--neon)' }}
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {s.name}
              </span>
            )}

            {/* Actions */}
            <div className="flex gap-1">
              {editId === s.id ? (
                <>
                  <button style={iconBtn('#4ade80', 'rgba(74,222,128,0.1)')} onClick={() => handleRename(s.id)}>
                    <Check className="w-3 h-3" />
                  </button>
                  <button style={iconBtn('var(--muted-foreground)', 'var(--border)')} onClick={() => setEditId(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    style={iconBtn('var(--muted-foreground)', 'transparent')}
                    title="Renommer"
                    onClick={() => { setEditId(s.id); setEditName(s.name) }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--foreground)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    style={iconBtn(s.active ? '#fbbf24' : '#4ade80', s.active ? 'rgba(251,191,36,0.08)' : 'rgba(74,222,128,0.08)')}
                    title={s.active ? 'Désactiver' : 'Activer'}
                    onClick={() => handleToggle(s.id, s.active)}
                  >
                    <Power className="w-3 h-3" />
                  </button>
                  <button
                    style={iconBtn('var(--muted-foreground)', 'transparent')}
                    title="Supprimer"
                    onClick={() => handleDelete(s.id)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {stations.length === 0 && (
          <div
            className="text-center py-10 rounded-xl text-sm"
            style={{ color: 'var(--muted-foreground)', border: '1px dashed var(--border)' }}
          >
            Aucune station configurée
          </div>
        )}
      </div>
    </div>
  )
}