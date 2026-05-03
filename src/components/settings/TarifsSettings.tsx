import { useState } from 'react'
import { Save, Check } from 'lucide-react'

const DEFAULT_TARIFS = {
  match6: 7,
  match7: 8,
  match8: 10,
  hourly: 30,
  longSessionHours: 3,
}

interface FieldProps {
  label: string
  desc: string
  field: keyof typeof DEFAULT_TARIFS
  unit?: string
  tarifs: typeof DEFAULT_TARIFS
  setTarifs: (t: typeof DEFAULT_TARIFS) => void
}

function Field({ label, desc, field, unit = 'MAD', tarifs, setTarifs }: FieldProps) {
  return (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="0.5"
          value={tarifs[field]}
          onChange={e => setTarifs({ ...tarifs, [field]: parseFloat(e.target.value) || 0 })}
          className="settings-input w-24 text-right font-mono text-sm"
        />
        <span className="text-sm w-12" style={{ color: 'var(--muted-foreground)' }}>{unit}</span>
      </div>
    </div>
  )
}

export default function TarifsSettings() {
  const [tarifs, setTarifs] = useState(DEFAULT_TARIFS)
  const [saved, setSaved]   = useState(false)

  const handleSave = () => {
    localStorage.setItem('playdesk_tarifs', JSON.stringify(tarifs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div
      className="rounded-xl px-5 mb-5 w-full"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <h4
        className="text-[11px] font-semibold uppercase tracking-wider py-3"
        style={{
          color: 'var(--muted-foreground)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  )

  return (
    <div className="w-full">
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Configurez les prix appliqués lors de la création de sessions.
      </p>

      <SectionCard title="Sessions Match">
        <Field label="Match 6 minutes"  desc="Prix par match de 6 minutes"         field="match6" tarifs={tarifs} setTarifs={setTarifs} />
        <Field label="Match 7 minutes"  desc="Prix par match de 7 minutes"         field="match7" tarifs={tarifs} setTarifs={setTarifs} />
        <Field label="Match 8+ minutes" desc="Prix par match de 8 minutes et plus" field="match8" tarifs={tarifs} setTarifs={setTarifs} />
      </SectionCard>

      <SectionCard title="Sessions Temps & Libre">
        <Field label="Tarif horaire"        desc="Tarif appliqué pour Temps et Jeu Libre"   field="hourly"            unit="MAD/h" tarifs={tarifs} setTarifs={setTarifs} />
        <Field label="Seuil longue session" desc="Alerte sonore après ce nombre d'heures"   field="longSessionHours"  unit="h"     tarifs={tarifs} setTarifs={setTarifs} />
      </SectionCard>

      {/* Auto-calc preview */}
      <div
        className="rounded-xl px-4 py-3.5 mb-6 w-full"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
          Tarifs Temps prépayé calculés automatiquement
        </p>
        <div className="flex gap-4 flex-wrap">
          {[
            { label: '30 min', value: (tarifs.hourly * 0.5).toFixed(0) },
            { label: '1h',     value: tarifs.hourly.toFixed(0) },
            { label: '2h',     value: (tarifs.hourly * 2).toFixed(0) },
          ].map(item => (
            <div key={item.label} className="flex items-baseline gap-1">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.label}</span>
              <span
                className="text-sm font-semibold font-mono"
                style={{ color: 'var(--neon)' }}
              >
                {item.value}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>MAD</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg transition-all"
        style={{
          background: saved ? '#16a34a' : 'var(--primary)',
          color: saved ? '#ffffff' : 'var(--primary-foreground)',
        }}
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Sauvegardé' : 'Sauvegarder les tarifs'}
      </button>
    </div>
  )
}