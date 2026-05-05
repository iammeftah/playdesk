import { useState } from 'react'
import { formatMAD, formatDate } from '../../lib/utils'
import { Search, Download } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = { match: 'Match', temps: 'Temps', libre: 'Libre' }
const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  match: { bg: 'rgba(74,222,128,0.08)',  color: '#4ade80', border: 'rgba(74,222,128,0.2)'  },
  temps: { bg: 'rgba(251,191,36,0.08)',  color: '#fbbf24', border: 'rgba(251,191,36,0.2)'  },
  libre: { bg: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: 'rgba(167,139,250,0.2)' },
}

function exportCSV(data: any[]) {
  const headers = ['ID', 'Station', 'Type', 'Manager', 'Début', 'Fin', 'Durée (min)', 'Matchs', 'Total (MAD)', 'Note']
  const rows = data.map(s => {
    const startMs = s.started_at_unix ? s.started_at_unix * 1000 : new Date(s.started_at).getTime()
    const endMs   = s.ended_at_unix   ? s.ended_at_unix   * 1000 : (s.ended_at ? new Date(s.ended_at).getTime() : null)
    const durationMin = endMs ? Math.round((endMs - startMs) / 60000) : ''
    return [
      s.id,
      s.station_name ?? '',
      TYPE_LABELS[s.type] ?? s.type,
      s.manager_name ?? '',
      s.started_at ? new Date(startMs).toLocaleString('fr-MA') : '',
      endMs        ? new Date(endMs).toLocaleString('fr-MA')   : '',
      durationMin,
      s.type === 'match' ? s.match_count : '',
      s.total_amount != null ? s.total_amount.toFixed(2) : '',
      (s.note ?? '').replace(/,/g, ';'),
    ]
  })

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${v}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `playdesk_sessions_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SessionHistory({ data }: { data: any[] }) {
  const [filter, setFilter]         = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = data.filter(s => {
    const matchText = !filter ||
      s.station_name?.toLowerCase().includes(filter.toLowerCase()) ||
      s.manager_name?.toLowerCase().includes(filter.toLowerCase())
    const matchType = !typeFilter || s.type === typeFilter
    return matchText && matchType
  })

  return (
    <div>
      {/* Filters row */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Rechercher station, manager..."
            className="settings-input w-full pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="settings-input"
        >
          <option value="">Tous types</option>
          <option value="match">Match</option>
          <option value="temps">Temps</option>
          <option value="libre">Libre</option>
        </select>

        {/* CSV Export */}
        <button
          onClick={() => exportCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-40 bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border/80"
          title="Exporter en CSV"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-10 text-sm rounded-xl"
          style={{ color: 'var(--muted-foreground)', border: '1px dashed var(--border)' }}
        >
          Aucune session trouvée
        </div>
      ) : (
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 pr-4 font-semibold">Station</th>
                <th className="text-left py-2 pr-4 font-semibold">Type</th>
                <th className="text-left py-2 pr-4 font-semibold">Manager</th>
                <th className="text-left py-2 pr-4 font-semibold">Début</th>
                <th className="text-right py-2 pr-4 font-semibold">Matchs</th>
                <th className="text-right py-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const tc = TYPE_COLORS[s.type]
                return (
                  <tr
                    key={s.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-2.5 pr-4 font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                      {s.station_name}
                    </td>
                    <td className="py-2.5 pr-4">
                      {tc ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                          {TYPE_LABELS[s.type]}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {s.manager_name}
                    </td>
                    <td className="py-2.5 pr-4 text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                      {formatDate(s.started_at)}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {s.type === 'match' ? s.match_count : '—'}
                    </td>
                    <td className="py-2.5 text-right font-bold font-mono text-sm" style={{ color: 'var(--neon)' }}>
                      {s.total_amount != null ? formatMAD(s.total_amount) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td colSpan={5} className="pt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                </td>
                <td className="pt-3 text-right font-bold font-mono text-sm" style={{ color: 'var(--foreground)' }}>
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