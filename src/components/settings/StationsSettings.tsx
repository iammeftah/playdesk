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
    if (!confirm('Désactiver cette station ?')) return
    await window.playdesk.stations.remove(id)
    await load()
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Gérez vos stations PS5. Les stations désactivées n'apparaissent pas en Caisse.
      </p>

      {/* Add form */}
      <div className="flex gap-3 mb-6">
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
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Station list */}
      <div className="flex flex-col gap-2">
        {stations.map(s => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              opacity: s.active ? 1 : 0.5,
            }}
          >
            {/* Status dot */}
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: s.active ? '#4ade80' : 'var(--muted-foreground)',
                boxShadow: s.active ? '0 0 6px rgba(74,222,128,0.6)' : 'none',
                opacity: s.active ? 1 : 0.4,
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
              <span
                className="flex-1 text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                {s.name}
              </span>
            )}

            {/* Actions */}
            <div className="flex gap-1">
              {editId === s.id ? (
                <>
                  <button
                    onClick={() => handleRename(s.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)' }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setEditId(s.id); setEditName(s.name) }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    title="Renommer"
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
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggle(s.id, s.active)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    title={s.active ? 'Désactiver' : 'Activer'}
                    style={{
                      color: s.active ? '#fbbf24' : '#4ade80',
                      background: 'transparent',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--muted)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    title="Supprimer"
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
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {stations.length === 0 && (
          <div
            className="text-center py-12 rounded-xl text-sm"
            style={{
              color: 'var(--muted-foreground)',
              border: '1px dashed var(--border)',
            }}
          >
            Aucune station configurée
          </div>
        )}
      </div>
    </div>
  )
}