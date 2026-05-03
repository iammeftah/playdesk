import { useState } from 'react'
import { formatMAD, formatDate } from '../../lib/utils'

const TYPE_LABELS: Record<string, string> = { match: 'Match', temps: 'Temps', libre: 'Libre' }
const TYPE_COLORS: Record<string, string> = {
  match: 'text-green-400 bg-green-900/30',
  temps: 'text-yellow-400 bg-yellow-900/30',
  libre: 'text-purple-400 bg-purple-900/30',
}

export default function SessionHistory({ data }: { data: any[] }) {
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = data.filter(s => {
    const matchText = !filter || s.station_name?.toLowerCase().includes(filter.toLowerCase())
      || s.manager_name?.toLowerCase().includes(filter.toLowerCase())
    const matchType = !typeFilter || s.type === typeFilter
    return matchText && matchType
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Rechercher station, manager..."
          className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-brand-500">
          <option value="">Tous types</option>
          <option value="match">Match</option>
          <option value="temps">Temps</option>
          <option value="libre">Libre</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-surface-500 text-sm">Aucune session trouvée</div>
      ) : (
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-surface-500 text-xs uppercase tracking-wider border-b border-surface-800">
                <th className="text-left py-2 pr-4">Station</th>
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2 pr-4">Manager</th>
                <th className="text-left py-2 pr-4">Début</th>
                <th className="text-right py-2 pr-4">Matchs</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                  <td className="py-2.5 pr-4 text-white font-medium">{s.station_name}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[s.type]}`}>
                      {TYPE_LABELS[s.type]}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-surface-400">{s.manager_name}</td>
                  <td className="py-2.5 pr-4 text-surface-400 text-xs">{formatDate(s.started_at)}</td>
                  <td className="py-2.5 pr-4 text-surface-400 text-right">
                    {s.type === 'match' ? s.match_count : '—'}
                  </td>
                  <td className="py-2.5 text-right font-bold text-brand-400">
                    {s.total_amount != null ? formatMAD(s.total_amount) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-surface-700">
                <td colSpan={5} className="pt-3 text-surface-400 text-xs">{filtered.length} sessions</td>
                <td className="pt-3 text-right font-bold text-white">
                  {formatMAD(filtered.reduce((a, s) => a + (s.total_amount ?? 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
