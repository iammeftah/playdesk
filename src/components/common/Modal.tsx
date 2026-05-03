// Modal.tsx — thin wrapper kept for backward compat with session components
// New code should use <Dialog> from @/components/ui/dialog directly.
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

interface ModalProps {
  children: React.ReactNode
  onClose: () => void
  open?: boolean
}

export default function Modal({ children, onClose, open = true }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-fit">
        {children}
      </DialogContent>
    </Dialog>
  )
}