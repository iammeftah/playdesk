import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff, Code2 } from 'lucide-react'

export default function LicenseSettings() {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    window.playdesk.license.status()
      .then(setStatus)
      .catch(() => setStatus({ activated: true, dev: true }))
  }, [])

  return (
    <div className="max-w-xl">
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Informations sur votre licence PlayDesk.
      </p>

      <div
        className="rounded-xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {/* Status row */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: status?.activated
                ? 'rgba(74, 222, 128, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
            }}
          >
            {status?.activated
              ? <ShieldCheck className="w-5 h-5" style={{ color: '#4ade80' }} />
              : <ShieldOff   className="w-5 h-5" style={{ color: '#ef4444' }} />
            }
          </div>
          <div>
            <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {status?.activated ? 'Licence active' : 'Non activé'}
            </h4>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {status?.activated ? 'Toutes les fonctionnalités sont disponibles' : 'Veuillez activer votre licence'}
            </p>
          </div>
          <div className="ml-auto">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: status?.activated ? '#4ade80' : '#ef4444',
                boxShadow: status?.activated
                  ? '0 0 8px rgba(74,222,128,0.6)'
                  : '0 0 8px rgba(239,68,68,0.6)',
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* Meta rows */}
        {status?.activatedAt && (
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--muted-foreground)' }}>Activé le</span>
            <span className="font-medium" style={{ color: 'var(--foreground)' }}>
              {new Date(status.activatedAt).toLocaleDateString('fr-MA')}
            </span>
          </div>
        )}

        {/* Dev mode banner */}
        {status?.dev && (
          <div
            className="rounded-lg px-4 py-3 flex items-start gap-3"
            style={{
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
            }}
          >
            <Code2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#eab308' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#eab308' }}>
                Mode développement
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(234,179,8,0.6)' }}>
                La vérification de licence est désactivée (IS_DEV = true)
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            PlayDesk v1.0.0 · SQLite local · Hors ligne
          </p>
        </div>
      </div>
    </div>
  )
}