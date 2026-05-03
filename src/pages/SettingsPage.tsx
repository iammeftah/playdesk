import { motion } from 'framer-motion'
import AppearanceSettings from '../components/settings/AppearanceSettings'
import LicenseSettings    from '../components/settings/LicenseSettings'
import StationsSettings   from '../components/settings/StationsSettings'
import TarifsSettings     from '../components/settings/TarifsSettings'
import UsersSettings      from '../components/settings/UsersSettings'
import { Sun, Tv2, CircleDollarSign, Users, ShieldCheck } from 'lucide-react'

const SectionHeader = ({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) => (
  <div className="flex items-center gap-2.5 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: 'var(--neon-dim)', border: '1px solid rgba(99,102,241,0.2)' }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: 'var(--neon)' }} />
    </div>
    <div>
      <p className="text-sm font-semibold leading-none" style={{ color: 'var(--foreground)' }}>{title}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>
    </div>
  </div>
)

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div
    className="rounded-xl p-5 w-full"
    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
  >
    {children}
  </div>
)

export default function SettingsPage() {
  return (
    <div
      className="flex-1 overflow-auto p-6"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Paramètres
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Configurez et personnalisez PlayDesk
          </p>
        </div>

        {/* 2-col grid — fills all available width */}
        <div className="grid grid-cols-2 gap-5">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-5">

            <Panel>
              <SectionHeader icon={Sun} title="Apparence" sub="Thème de l'interface" />
              <AppearanceSettings />
            </Panel>

            <Panel>
              <SectionHeader icon={CircleDollarSign} title="Tarifs" sub="Prix par type de session" />
              <TarifsSettings />
            </Panel>

          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-5">

            <Panel>
              <SectionHeader icon={Tv2} title="Stations" sub="Gestion des postes de jeu" />
              <StationsSettings />
            </Panel>

            <Panel>
              <SectionHeader icon={Users} title="Utilisateurs" sub="Comptes et accès" />
              <UsersSettings />
            </Panel>

            <Panel>
              <SectionHeader icon={ShieldCheck} title="Licence" sub="Activation et validité" />
              <LicenseSettings />
            </Panel>

          </div>
        </div>
      </motion.div>
    </div>
  )
}