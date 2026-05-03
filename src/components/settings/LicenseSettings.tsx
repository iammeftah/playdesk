import { useEffect, useState } from 'react'

export default function LicenseSettings() {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    window.playdesk.license.status().then(setStatus).catch(() => setStatus({ activated: true, dev: true }))
  }, [])

  return (
    <div className="max-w-xl">
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status?.activated ? 'bg-green-500' : 'bg-red-500'}`} />
          <h4 className="text-white font-semibold">
            {status?.activated ? 'Licence active' : 'Non activé'}
          </h4>
        </div>

        {status?.activatedAt && (
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">Activé le</span>
            <span className="text-white">{new Date(status.activatedAt).toLocaleDateString('fr-MA')}</span>
          </div>
        )}

        {status?.dev && (
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-3">
            <p className="text-yellow-400 text-sm font-medium">Mode développement</p>
            <p className="text-yellow-600 text-xs mt-0.5">La vérification de licence est désactivée (IS_DEV = true)</p>
          </div>
        )}

        <div className="border-t border-surface-800 pt-4 text-xs text-surface-500">
          <p>PlayDesk v1.0.0 · SQLite local · Hors ligne</p>
        </div>
      </div>
    </div>
  )
}
