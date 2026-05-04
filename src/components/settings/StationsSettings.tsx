import { useEffect, useState } from 'react'
import { Plus, Pencil, Power, Trash2, Check, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function StationsSettings() {
  const [stations, setStations]         = useState<any[]>([])
  const [newName, setNewName]           = useState('')
  const [editId, setEditId]             = useState<number | null>(null)
  const [editName, setEditName]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

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

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return
    await window.playdesk.stations.remove(deleteTarget.id)
    setDeleteTarget(null)
    await load()
  }

  return (
    <div className="w-full">
      <p className="text-sm text-muted-foreground mb-6">
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
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
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border border-border bg-muted transition-all ${!s.active ? 'opacity-55' : ''}`}
          >
            {/* Status dot */}
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${s.active ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.6)]' : 'bg-muted-foreground'}`}
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
                className="settings-input flex-1 py-1 text-sm border-primary"
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm font-medium text-foreground">
                {s.name}
              </span>
            )}

            {/* Actions */}
            <div className="flex gap-1">
              {editId === s.id ? (
                <>
                  <IconBtn
                    onClick={() => handleRename(s.id)}
                    className="text-green-500 dark:text-green-400 bg-green-500/10 hover:bg-green-500/20"
                    title="Confirmer"
                  >
                    <Check className="w-3 h-3" />
                  </IconBtn>
                  <IconBtn
                    onClick={() => setEditId(null)}
                    className="text-muted-foreground bg-border/50 hover:bg-border"
                    title="Annuler"
                  >
                    <X className="w-3 h-3" />
                  </IconBtn>
                </>
              ) : (
                <>
                  <IconBtn
                    onClick={() => { setEditId(s.id); setEditName(s.name) }}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                    title="Renommer"
                  >
                    <Pencil className="w-3 h-3" />
                  </IconBtn>
                  <IconBtn
                    onClick={() => handleToggle(s.id, s.active)}
                    className={s.active
                      ? 'text-amber-500 dark:text-amber-400 bg-amber-500/8 hover:bg-amber-500/15'
                      : 'text-green-500 dark:text-green-400 bg-green-500/8 hover:bg-green-500/15'
                    }
                    title={s.active ? 'Désactiver' : 'Activer'}
                  >
                    <Power className="w-3 h-3" />
                  </IconBtn>
                  <IconBtn
                    onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                    className="text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </IconBtn>
                </>
              )}
            </div>
          </div>
        ))}

        {stations.length === 0 && (
          <div className="text-center py-10 rounded-xl text-sm text-muted-foreground border border-dashed border-border">
            Aucune station configurée
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la station</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer <span className="font-semibold text-foreground">{deleteTarget?.name}</span> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-500 dark:hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Small icon button helper ─────────────────────────────────────────────────
function IconBtn({ onClick, children, className, title }: {
  onClick:   () => void
  children:  React.ReactNode
  className: string
  title?:    string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-[26px] h-[26px] rounded-md flex items-center justify-center shrink-0 transition-colors cursor-pointer ${className}`}
    >
      {children}
    </button>
  )
}