import { motion } from 'framer-motion'
import { Station, Session } from '../../types'
import StationCard from './StationCard'

interface Props { stations: Station[]; sessions: Session[]; onRefresh: () => void }

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, scale: 0.97, y: 6 },
  show:   { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
}

export default function StationGrid({ stations, sessions, onRefresh }: Props) {
  const getSession = (stationId: number) =>
    sessions.find(s => s.station_id === stationId && s.status !== 'ended')

  if (stations.length === 0) return (
    <div className="flex items-center justify-center h-64 text-surface-400 text-sm">
      Aucune station configurée
    </div>
  )

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {stations.map(station => (
        <motion.div key={station.id} variants={item}>
          <StationCard
            station={station}
            session={getSession(station.id)}
            onRefresh={onRefresh}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}