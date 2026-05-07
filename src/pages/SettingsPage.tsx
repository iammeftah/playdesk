import { motion } from 'framer-motion'
import AppearanceSettings  from '../components/settings/AppearanceSettings'
import LicenseSettings     from '../components/settings/LicenseSettings'
import StationsSettings    from '../components/settings/StationsSettings'
import TarifsSettings      from '../components/settings/TarifsSettings'
import UsersSettings       from '../components/settings/UsersSettings'
import DangerZoneSettings  from '../components/settings/DangerZoneSettings'
import { Sun, Tv2, CircleDollarSign, Users, ShieldCheck, AlertTriangle } from 'lucide-react'

const SectionHeader = ({ icon: Icon, title, sub, danger }: {
  icon: React.ElementType
  title: string
  sub: string
  danger?: boolean
}) => (
  <div
    className="flex items-center gap-2.5 mb-5 pb-4"
    style={{ borderBottom: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : 'var(--border)'}` }}
  >
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
      style={{
        background: danger ? 'rgba(239,68,68,0.1)' : 'var(--neon-dim)',
        border: danger ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(99,102,241,0.2)',
      }}
    >
      <Icon
        className="w-3.5 h-3.5"
        style={{ color: danger ? '#f87171' : 'var(--neon)' }}
      />
    </div>
    <div>
      <p
        className="text-sm font-semibold leading-none"
        style={{ color: danger ? '#f87171' : 'var(--foreground)' }}
      >
        {title}
      </p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
        {sub}
      </p>
    </div>
  </div>
)

const Panel = ({ children, danger }: { children: React.ReactNode; danger?: boolean }) => (
  <div
    className="rounded-xl p-5 w-full"
    style={{
      background: danger ? 'rgba(239,68,68,0.03)' : 'var(--card)',
      border: `1px solid ${danger ? 'rgba(239,68,68,0.18)' : 'var(--border)'}`,
    }}
  >
    {children}
  </div>
)

const GroupLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3 px-0.5"
    style={{ color: 'var(--muted-foreground)' }}
  >
    {children}
  </p>
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
        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Paramètres
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Configurez et personnalisez PlayDesk
          </p>
        </div>

        {/* ══════════════════════════════════════════════
            SECTION 1 — MÉTIER
            Tarifs (tall, fixed fields) + Stations (list)
            Similar height profile → side by side
        ══════════════════════════════════════════════ */}
        <GroupLabel>Paramètres métier</GroupLabel>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <Panel>
            <SectionHeader icon={CircleDollarSign} title="Tarifs" sub="Prix par type de session" />
            <TarifsSettings />
          </Panel>

          <Panel>
            <SectionHeader icon={Tv2} title="Stations" sub="Gestion des postes de jeu" />
            <StationsSettings />
          </Panel>
        </div>

        {/* ══════════════════════════════════════════════
            SECTION 2 — UTILISATEURS
            Full-width: list that can grow, benefits from
            the extra horizontal room for the action buttons
        ══════════════════════════════════════════════ */}
        <Panel>
          <SectionHeader icon={Users} title="Utilisateurs" sub="Comptes et accès" />
          <UsersSettings />
        </Panel>

        {/* ── Divider ── */}
        <div
          className="my-6"
          style={{ borderTop: '1px solid var(--border)' }}
        />

        {/* ══════════════════════════════════════════════
            SECTION 3 — SYSTÈME & CONFIG
            Apparence (very tall) left
            Licence + Danger stacked right (both short-medium)
        ══════════════════════════════════════════════ */}
        <GroupLabel>Système &amp; configuration</GroupLabel>

        <div className="grid grid-cols-2 gap-5">

          {/* Left — Apparence is the tallest component, anchors the column */}
          <Panel>
            <SectionHeader icon={Sun} title="Apparence" sub="Thème, couleurs et police" />
            <AppearanceSettings />
          </Panel>

          {/* Right — Licence + Danger Zone stacked; together ≈ height of Apparence */}
          <div className="flex flex-col gap-5">
            <Panel>
              <SectionHeader icon={ShieldCheck} title="Licence" sub="Activation et validité" />
              <LicenseSettings />
            </Panel>

            <Panel danger>
              <SectionHeader
                icon={AlertTriangle}
                title="Zone Danger"
                sub="Export · Réinitialisation · Données"
                danger
              />
              <DangerZoneSettings />
            </Panel>
          </div>

        </div>
      </motion.div>
    </div>
  )
}