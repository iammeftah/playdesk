import { useEffect } from 'react'
import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'
import { useUndoStore, UndoAction } from '../../store/undoStore'

/**
 * Bridges the undoStore → sonner toasts.
 * Renders nothing itself; just watches the store and fires toasts.
 */
function UndoToastWatcher() {
  const actions = useUndoStore(s => s.actions)
  const remove  = useUndoStore(s => s.remove)

  useEffect(() => {
    actions.forEach(action => {
      const duration = action.expiresAt - Date.now()
      if (duration <= 0) { remove(action.id); return }

      toast(action.label, {
        id:          action.id,
        duration,
        description: action.description,
        icon:        <Undo2 size={14} className="text-amber-400 mt-0.5" />,
        action: {
          label: 'Annuler',
          onClick: async () => {
            try { await action.onUndo() } finally { remove(action.id) }
          },
        },
        onDismiss:    () => remove(action.id),
        onAutoClose:  () => remove(action.id),
      })
    })
  }, [actions.map(a => a.id).join(',')])

  return null
}

export default function UndoToastContainer() {
  return <UndoToastWatcher />
}