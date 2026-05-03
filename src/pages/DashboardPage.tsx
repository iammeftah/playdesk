import { useEffect, useState } from 'react'
import { todayISO, formatMAD } from '../lib/utils'
import RevenueChart from '../components/dashboard/RevenueChart'
import StationUtilization from '../components/dashboard/StationUtilization'
import PeakHoursHeatmap from '../components/dashboard/PeakHoursHeatmap'
import SessionHistory from '../components/dashboard/SessionHistory'
import SummaryCards from '../components/dashboard/SummaryCards'

type Period = 'day' | 'week' | 'month'

export default function DashboardPage() {
  const [summary, setSummary]       = useState<any>(null)
  const [revenue, setRevenue]       = useState<any[]>([])
  const [stationStats, setStation]  = useState<any[]>([])
  const [peakHours, setPeakHours]   = useState<any[]>([])
  const [history, setHistory]       = useState<any[]>([])
  const [period, setPeriod]         = useState<Period>('day')
  const [loading, setLoading]       = useState(true)
  const [date, setDate]             = useState(todayISO())

  const load = async () => {
    setLoading(true)
    try {
      const [sum, rev, stat, peak, hist] = await Promise.all([
        window.playdesk.dashboard.summary(date),
        window.playdesk.dashboard.revenue(period),
        window.playdesk.dashboard.stationStats(),
        window.playdesk.dashboard.peakHours(),
        window.playdesk.sessions.history({}),
      ])
      setSummary(sum); setRevenue(rev); setStation(stat)
      setPeakHours(peak); setHistory(hist)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [date, period])

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Tableau de bord</h2>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-brand-500" />
          <button onClick={load}
            className="px-3 py-1.5 text-sm bg-surface-800 border border-surface-700 rounded-lg text-surface-300 hover:text-white transition-colors">
            ↻
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && <SummaryCards data={summary} />}

      {/* Revenue Chart */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Revenus</h3>
          <div className="flex gap-1">
            {(['day','week','month'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors
                  ${period === p ? 'bg-brand-600 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
        {loading ? <div className="h-48 flex items-center justify-center text-surface-500 animate-pulse">Chargement...</div>
          : <RevenueChart data={revenue} period={period} />}
      </div>

      {/* Station + Peak Hours */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Utilisation stations</h3>
          {loading ? <div className="h-32 flex items-center justify-center text-surface-500 animate-pulse">Chargement...</div>
            : <StationUtilization data={stationStats} />}
        </div>
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Heures de pointe</h3>
          {loading ? <div className="h-32 flex items-center justify-center text-surface-500 animate-pulse">Chargement...</div>
            : <PeakHoursHeatmap data={peakHours} />}
        </div>
      </div>

      {/* History */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Historique des sessions</h3>
        <SessionHistory data={history} />
      </div>
    </div>
  )
}
