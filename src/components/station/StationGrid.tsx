import { Station, Session } from '../../types'
import StationCard from './StationCard'

interface Props { stations: Station[]; sessions: Session[]; onRefresh: () => void }

export default function StationGrid({ stations, sessions, onRefresh }: Props) {
  const getSession = (stationId: number) =>
    sessions.find((s) => s.station_id === stationId && s.status !== 'ended')

  if (stations.length === 0) return (
    <div className="flex items-center justify-center h-64 text-surface-400">
      Aucune station configurée
    </div>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          session={getSession(station.id)}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  )
}
