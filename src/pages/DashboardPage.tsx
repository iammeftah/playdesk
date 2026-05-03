import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { todayISO } from '../lib/utils'
import RevenueChart from '../components/dashboard/RevenueChart'
import StationUtilization from '../components/dashboard/StationUtilization'
import PeakHoursHeatmap from '../components/dashboard/PeakHoursHeatmap'
import SessionHistory from '../components/dashboard/SessionHistory'
import SessionTypePie from '../components/dashboard/SessionTypePie'
import SummaryCards from '../components/dashboard/SummaryCards'
import DatePicker from '../components/common/DatePicker'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Period = 'day' | 'week' | 'month'

const PERIOD_LABELS: Record<Period, string> = {
  day:   'Jour',
  week:  'Semaine',
  month: 'Mois',
}

const Skeleton = () => (
  <div className="h-40 flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-white/8 border-t-white/40 rounded-full animate-spin" />
  </div>
)

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 10 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: 'easeOut' as const, delay },
})

export default function DashboardPage() {
  const [summary, setSummary]      = useState<any>(null)
  const [revenue, setRevenue]      = useState<any[]>([])
  const [stationStats, setStation] = useState<any[]>([])
  const [peakHours, setPeakHours]  = useState<any[]>([])
  const [history, setHistory]      = useState<any[]>([])
  const [period, setPeriod]        = useState<Period>('day')
  const [loading, setLoading]      = useState(true)
  const [date, setDate]            = useState(todayISO())

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
      setSummary(sum)
      setRevenue(rev)
      setStation(stat)
      setPeakHours(peak)
      setHistory(hist)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [date, period])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-7 flex flex-col gap-6 overflow-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Tableau de bord
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide">
            Vue d'ensemble des sessions et revenus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DatePicker value={date} onChange={setDate} />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={load}
            className="text-muted-foreground hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <motion.div {...fadeUp(0.04)}>
          <SummaryCards data={summary} />
        </motion.div>
      )}

      {/* Revenue chart */}
      <motion.div {...fadeUp(0.08)}>
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Revenus</CardTitle>
            {/* Period selector */}
            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={
                    period === p
                      ? 'px-3 py-1 text-xs font-medium rounded-md bg-zinc-700 text-white transition-all'
                      : 'px-3 py-1 text-xs font-medium rounded-md text-muted-foreground hover:text-white transition-all'
                  }
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton /> : <RevenueChart data={revenue} period={period} />}
          </CardContent>
        </Card>
      </motion.div>

      {/* 3-col row */}
      <motion.div {...fadeUp(0.12)} className="grid grid-cols-3 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Utilisation stations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton /> : <StationUtilization data={stationStats} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Heures de pointe</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton /> : <PeakHoursHeatmap data={peakHours} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Répartition sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !summary ? <Skeleton /> : <SessionTypePie byType={summary.byType ?? []} />}
          </CardContent>
        </Card>
      </motion.div>

      {/* Session history */}
      <motion.div {...fadeUp(0.16)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Historique des sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionHistory data={history} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}