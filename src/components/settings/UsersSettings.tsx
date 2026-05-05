import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { UserPlus, PowerOff, Power, Trash2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'

type ConfirmTarget = { id: number; username: string } | null

export default function UsersSettings() {
  const { user: currentUser } = useAuthStore()

  const [users, setUsers]     = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm]             = useState({ username: '', password: '', role: 'manager' })
  const [formError, setFormError]   = useState('')

  // Confirmation dialogs
  const [confirmDisable, setConfirmDisable] = useState<ConfirmTarget>(null)
  const [confirmEnable,  setConfirmEnable]  = useState<ConfirmTarget>(null)
  const [confirmDelete,  setConfirmDelete]  = useState<ConfirmTarget>(null)

  const load = async () => { setUsers(await window.playdesk.users.list()) }
  useEffect(() => { load() }, [])

  const resetCreate = () => {
    setForm({ username: '', password: '', role: 'manager' })
    setFormError('')
  }

  const handleCreate = async () => {
    setFormError('')
    if (!form.username.trim() || !form.password.trim()) {
      setFormError('Tous les champs sont requis')
      return
    }
    if (form.password.length < 6) {
      setFormError('Mot de passe : 6 caractères minimum')
      return
    }
    setLoading(true)
    const res = await window.playdesk.users.create(form)
    if (res.success) {
      setCreateOpen(false)
      resetCreate()
      await load()
    } else {
      setFormError(res.error ?? 'Erreur création')
    }
    setLoading(false)
  }

  const handleDisable = async () => {
    if (!confirmDisable) return
    setLoading(true)
    await window.playdesk.users.disable(confirmDisable.id)
    setConfirmDisable(null)
    await load()
    setLoading(false)
  }

  const handleEnable = async () => {
    if (!confirmEnable) return
    setLoading(true)
    await window.playdesk.users.enable(confirmEnable.id)
    setConfirmEnable(null)
    await load()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setLoading(true)
    await window.playdesk.users.delete(confirmDelete.id)
    setConfirmDelete(null)
    await load()
    setLoading(false)
  }

  return (
    <div className="w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">Gérez les accès au système.</p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => { setCreateOpen(true); setFormError('') }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Nouveau compte
        </Button>
      </div>

      {/* Users list */}
      <div className="flex flex-col gap-2">
        {users.map(u => (
          <div
            key={u.id}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-muted transition-opacity ${!u.active ? 'opacity-55' : ''}`}
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-lg bg-muted-foreground/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-foreground uppercase">
                {u.username?.[0] ?? '?'}
              </span>
            </div>

            {/* Username */}
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {u.username}
            </span>

            {/* Role pill */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
              u.role === 'admin'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
            }`}>
              {u.role}
            </span>

            {/* Inactive badge */}
            {!u.active && (
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
                désactivé
              </span>
            )}

            {/* Actions — hidden for the logged-in user's own row */}
            {u.id !== currentUser?.id && (
              <div className="flex gap-1">
                {!!u.active ? (
                  <IconBtn
                    onClick={() => setConfirmDisable({ id: u.id, username: u.username })}
                    className="text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10"
                    title="Désactiver"
                  >
                    <PowerOff className="w-3 h-3" />
                  </IconBtn>
                ) : (
                  <IconBtn
                    onClick={() => setConfirmEnable({ id: u.id, username: u.username })}
                    className="text-green-500 dark:text-green-400 hover:bg-green-500/15"
                    title="Réactiver"
                  >
                    <Power className="w-3 h-3" />
                  </IconBtn>
                )}

                <IconBtn
                  onClick={() => setConfirmDelete({ id: u.id, username: u.username })}
                  className="text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10"
                  title="Supprimer définitivement"
                >
                  <Trash2 className="w-3 h-3" />
                </IconBtn>
              </div>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-10 rounded-xl text-sm text-muted-foreground border border-dashed border-border">
            Aucun utilisateur
          </div>
        )}
      </div>

      {/* ── Create user dialog ── */}
      <Dialog
        open={createOpen}
        onOpenChange={open => { setCreateOpen(open); if (!open) resetCreate() }}
      >
        <DialogContent className="w-[420px]">
          <DialogHeader>
            <DialogTitle>Créer un compte</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            {formError && (
              <p className="text-xs text-red-500 dark:text-red-400">{formError}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Nom d'utilisateur</Label>
              <Input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="ex: manager1"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Mot de passe initial</Label>
              <Input
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                type="password"
                placeholder="6 caractères minimum"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <p className="text-[11px] text-muted-foreground">
                L'utilisateur pourra le modifier depuis son profil.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Rôle</Label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Création...' : 'Créer le compte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Disable confirm ── */}
      <AlertDialog open={!!confirmDisable} onOpenChange={open => { if (!open) setConfirmDisable(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver le compte</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous désactiver{' '}
              <span className="font-semibold text-foreground">{confirmDisable?.username}</span> ?
              Le compte ne pourra plus se connecter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisable} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white">
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Enable confirm ── */}
      <AlertDialog open={!!confirmEnable} onOpenChange={open => { if (!open) setConfirmEnable(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réactiver le compte</AlertDialogTitle>
            <AlertDialogDescription>
              Réactiver{' '}
              <span className="font-semibold text-foreground">{confirmEnable?.username}</span> ?
              Le compte pourra se reconnecter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnable} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white">
              Réactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le compte</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer définitivement{' '}
              <span className="font-semibold text-foreground">{confirmDelete?.username}</span> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

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