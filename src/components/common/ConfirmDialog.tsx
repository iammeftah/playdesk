import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'

interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
  open?: boolean
  variant?: 'danger' | 'default'
}

export default function ConfirmDialog({ message, onConfirm, onCancel, open = true, variant = 'danger' }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={v => !v && onCancel()}>
      <AlertDialogContent
        className="p-0 overflow-hidden"
        style={{
          background:   'var(--card)',
          border:       '1px solid var(--border)',
          borderRadius: '14px',
          boxShadow:    '0 0 0 1px rgba(99,102,241,0.08), 0 24px 64px rgba(0,0,0,0.7)',
          maxWidth:     '360px',
          width:        '100%',
        }}
      >
        {/* Body */}
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: variant === 'danger'
                ? 'rgba(239,68,68,0.1)'
                : 'var(--neon-dim)',
              border: variant === 'danger'
                ? '1px solid rgba(239,68,68,0.2)'
                : '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <AlertTriangle
              className="w-5 h-5"
              style={{ color: variant === 'danger' ? '#ef4444' : 'var(--neon)' }}
            />
          </div>

          <AlertDialogDescription
            className="text-sm leading-relaxed"
            style={{ color: 'var(--foreground)' }}
          >
            {message}
          </AlertDialogDescription>
        </div>

        {/* Footer */}
        <AlertDialogFooter
          className="flex gap-2 px-6 pb-5"
          style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.25rem' }}
        >
          <AlertDialogCancel
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              background:  'var(--muted)',
              color:       'var(--muted-foreground)',
              border:      '1px solid var(--border)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--foreground)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--muted-foreground)'
            }}
          >
            Annuler
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={{
              background: variant === 'danger'
                ? 'rgba(239,68,68,0.85)'
                : 'var(--neon)',
              color: '#ffffff',
              border: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = variant === 'danger' ? '#ef4444' : 'var(--neon)'
              e.currentTarget.style.opacity = '1'
            }}
          >
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}