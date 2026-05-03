import { useState } from 'react'

const DEFAULT_TARIFS = {
  match6: 7,
  match7: 8,
  match8: 10,
  hourly: 30,
  longSessionHours: 3,
}

export default function TarifsSettings() {
  const [tarifs, setTarifs] = useState(DEFAULT_TARIFS)
  const [saved, setSaved]   = useState(false)

  const handleSave = () => {
    // Store in localStorage for now (future: persist via IPC)
    localStorage.setItem('playdesk_tarifs', JSON.stringify(tarifs))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Field = ({ label, desc, field, unit = 'MAD' }: { label: string; desc: string; field: keyof typeof DEFAULT_TARIFS; unit?: string }) => (
    <div className="flex items-center justify-between py-4 border-b border-surface-800">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-surface-500 text-xs mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" min="0" step="0.5" value={tarifs[field]}
          onChange={e => setTarifs({...tarifs, [field]: parseFloat(e.target.value) || 0})}
          className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500 w-24 text-right font-mono" />
        <span className="text-surface-400 text-sm w-12">{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-xl">
      <p className="text-surface-400 text-sm mb-5">Configurez les prix appliqués lors de la création de sessions.</p>

      <div className="bg-surface-900 border border-surface-800 rounded-xl px-5 mb-6">
        <h4 className="text-surface-400 text-xs uppercase tracking-wider py-3 border-b border-surface-800">Sessions Match</h4>
        <Field label="Match 6 minutes"  desc="Prix par match de 6 minutes" field="match6" />
        <Field label="Match 7 minutes"  desc="Prix par match de 7 minutes" field="match7" />
        <Field label="Match 8+ minutes" desc="Prix par match de 8 minutes et plus" field="match8" />
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-xl px-5 mb-6">
        <h4 className="text-surface-400 text-xs uppercase tracking-wider py-3 border-b border-surface-800">Sessions Temps & Libre</h4>
        <Field label="Tarif horaire" desc="Tarif appliqué pour Temps et Jeu Libre" field="hourly" unit="MAD/h" />
        <Field label="Seuil longue session" desc="Alerte sonore après ce nombre d'heures" field="longSessionHours" unit="h" />
      </div>

      <div className="bg-surface-800/50 rounded-xl p-4 mb-5 text-sm text-surface-400">
        <p className="font-medium text-surface-300 mb-1">Tarifs Temps prépayé calculés automatiquement :</p>
        <p>30 min = {(tarifs.hourly * 0.5).toFixed(0)} MAD · 1h = {tarifs.hourly} MAD · 2h = {tarifs.hourly * 2} MAD</p>
      </div>

      <button onClick={handleSave}
        className={`px-6 py-2.5 font-semibold text-sm rounded-lg transition-colors ${saved ? 'bg-green-700 text-white' : 'bg-brand-600 hover:bg-brand-500 text-white'}`}>
        {saved ? '✓ Sauvegardé' : 'Sauvegarder les tarifs'}
      </button>
    </div>
  )
}
