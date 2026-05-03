export default function ConfirmDialog({ message, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-xl p-6 w-80">
        <p className="text-white mb-4">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm">Confirmer</button>
        </div>
      </div>
    </div>
  )
}
