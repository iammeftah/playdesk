import { useState } from 'react'
import { Station } from '../../types'
import { calcMatchPrice } from '../../lib/pricing'

interface Props {
  station: Station
  managerId: number
  onClose: () => void
  onStarted: () => void
}

const PRESET_DURATIONS = [
  { minutes: 30, label: '30 min', price: 15 },
  { minutes: 60, label: '1 heure', price: 30 },
  { minutes: 120, label: '2 heures', price: 60 },
]

export default function StartSessionModal({ station, managerId, onClose, onStarted }: Props) {
  const [type, setType] = useState<'match' | 'temps' | 'libre'>('match')
  const [matchDuration, setMatchDuration] = useState(8)
  const [prepaidMinutes, setPrepaidMinutes] = useState(60)
  const [customMinutes, setCustomMinutes] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)

  const effectivePrepaidMinutes = useCustom
    ? parseInt(customMinutes) || 60
    : prepaidMinutes

  const customPrice = useCustom
    ? ((parseInt(customMinutes) || 0) / 60 * 30).toFixed(2)
    : null

  const handleStart = async () => {
    if (type === 'temps' && useCustom && (!customMinutes || parseInt(customMinutes) <= 0)) return
    setLoading(true)
    await window.playdesk.sessions.start({
      stationId: station.id,
      managerId,
      type,
      matchDuration: type === 'match' ? matchDuration : undefined,
      prepaidMinutes: type === 'temps' ? effectivePrepaidMinutes : undefined,
    })
    onStarted()
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface-900 border border-surface-700 rounded-2xl p-6 w-[420px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">Démarrer — {station.name}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 mb-5">
          {(['match', 'temps', 'libre'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors
                ${type === t ? 'bg-brand-600 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
              {t === 'match' ? '🎮 Match' : t === 'temps' ? '⏱ Temps' : '∞ Libre'}
            </button>
          ))}
        </div>

        {/* Match options */}
        {type === 'match' && (
          <div className="mb-5">
            <p className="text-surface-400 text-xs uppercase tracking-wider mb-3">Durée par match</p>
            <div className="grid grid-cols-3 gap-2">
              {([6, 7, 8] as const).map((d) => (
                <button key={d} onClick={() => setMatchDuration(d)}
                  className={`py-3 rounded-lg text-sm font-medium transition-colors text-center
                    ${matchDuration === d ? 'bg-brand-600 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                  <div className="font-bold">{d === 8 ? '8+ min' : `${d} min`}</div>
                  <div className="text-xs mt-0.5 opacity-75">{calcMatchPrice(d)} MAD</div>
                </button>
              ))}
            </div>
            <p className="text-surface-500 text-xs mt-3">
              Total = nombre de matchs × {calcMatchPrice(matchDuration)} MAD
            </p>
          </div>
        )}

        {/* Temps options */}
        {type === 'temps' && (
          <div className="mb-5">
            <p className="text-surface-400 text-xs uppercase tracking-wider mb-3">Durée prépayée</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PRESET_DURATIONS.map(({ minutes, label, price }) => (
                <button key={minutes}
                  onClick={() => { setPrepaidMinutes(minutes); setUseCustom(false) }}
                  className={`py-3 rounded-lg text-sm font-medium transition-colors text-center
                    ${!useCustom && prepaidMinutes === minutes ? 'bg-brand-600 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                  <div className="font-bold">{label}</div>
                  <div className="text-xs mt-0.5 opacity-75">{price} MAD</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setUseCustom(true)}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors
                ${useCustom ? 'bg-brand-600 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
              Personnalisé
            </button>
            {useCustom && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Minutes"
                  className="flex-1 bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-white text-center font-mono outline-none focus:border-brand-500"
                  autoFocus
                />
                <span className="text-surface-400 text-sm">min</span>
                {customPrice && (
                  <span className="text-brand-400 font-bold text-sm">{customPrice} MAD</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Libre info */}
        {type === 'libre' && (
          <div className="mb-5 bg-surface-800 rounded-lg p-4">
            <p className="text-surface-300 text-sm">Chronomètre ouvert — facturation à la minute.</p>
            <p className="text-brand-400 text-sm font-semibold mt-1">0.50 MAD / minute (30 MAD/h)</p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-surface-800/50 rounded-lg px-4 py-3 mb-5 text-sm text-surface-400">
          {type === 'match' && <span>Match · {matchDuration === 8 ? '8+ min' : `${matchDuration} min`} · {calcMatchPrice(matchDuration)} MAD/match</span>}
          {type === 'temps' && <span>Temps prépayé · {effectivePrepaidMinutes} min · {(effectivePrepaidMinutes / 60 * 30).toFixed(2)} MAD</span>}
          {type === 'libre' && <span>Jeu libre · facturation à la minute</span>}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-surface-800 text-surface-300 hover:text-white text-sm font-medium">
            Annuler
          </button>
          <button onClick={handleStart} disabled={loading || (type === 'temps' && useCustom && !customMinutes)}
            className="flex-1 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
            {loading ? 'Démarrage...' : '▶ Démarrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
