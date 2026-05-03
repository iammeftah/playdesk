import { useEffect, useState } from 'react'

export default function StationsSettings() {
  const [stations, setStations] = useState<any[]>([])
  const [newName, setNewName]   = useState('')
  const [editId, setEditId]     = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    const all = await window.playdesk.stations.list()
    setStations(all)
  }

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
      <p className="text-surface-400 text-sm mb-5">Gérez vos stations PS5. Les stations désactivées n'apparaissent pas en Caisse.</p>

      {/* Add new */}
      <div className="flex gap-3 mb-6">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nom de la station (ex: PS5-5)"
          className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-brand-500" />
        <button onClick={handleAdd} disabled={loading || !newName.trim()}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors">
          + Ajouter
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {stations.map(s => (
          <div key={s.id} className={`flex items-center gap-3 bg-surface-900 border rounded-xl px-4 py-3 transition-all
            ${s.active ? 'border-surface-800' : 'border-surface-800 opacity-50'}`}>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.active ? 'bg-green-500' : 'bg-surface-600'}`} />

            {editId === s.id ? (
              <input value={editName} onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(s.id); if (e.key === 'Escape') setEditId(null) }}
                className="flex-1 bg-surface-800 border border-brand-500 rounded-lg px-3 py-1 text-white text-sm outline-none"
                autoFocus />
            ) : (
              <span className="flex-1 text-white font-medium text-sm">{s.name}</span>
            )}

            <div className="flex gap-2 text-xs">
              {editId === s.id ? (
                <>
                  <button onClick={() => handleRename(s.id)} className="text-green-400 hover:text-green-300 font-medium px-2 py-1">✓ Sauver</button>
                  <button onClick={() => setEditId(null)} className="text-surface-400 hover:text-white px-2 py-1">✕</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditId(s.id); setEditName(s.name) }}
                    className="text-surface-400 hover:text-white px-2 py-1 rounded hover:bg-surface-800 transition-colors">
                    ✏ Renommer
                  </button>
                  <button onClick={() => handleToggle(s.id, s.active)}
                    className={`px-2 py-1 rounded transition-colors ${s.active ? 'text-yellow-400 hover:bg-surface-800' : 'text-green-400 hover:bg-surface-800'}`}>
                    {s.active ? '⏸ Désactiver' : '▶ Activer'}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {stations.length === 0 && (
          <div className="text-center py-10 text-surface-500 text-sm">Aucune station configurée</div>
        )}
      </div>
    </div>
  )
}
