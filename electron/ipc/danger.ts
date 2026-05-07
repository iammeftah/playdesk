/**
 * ipc/danger.ts
 *
 * Export Excel — rapport de progression PlayDesk
 *
 * PHILOSOPHIE : Chaque export répond à une vraie question de gestion.
 * Les tendances sont intégrées dans le fichier lui-même — pas besoin
 * de comparer deux exports manuellement.
 *
 * FEUILLES (dans l'ordre d'utilisation)
 * ─────────────────────────────────────
 *  1. 📊 Vue d'ensemble   — Tendances : cette semaine vs sem. précédente,
 *                           ce mois vs mois précédent, tout-temps.
 *                           Le patron ouvre ça EN PREMIER.
 *
 *  2. 🚨 Alertes          — Toutes les anomalies : 0 MAD sur payant,
 *                           sessions < 2min, écarts de caisse shifts.
 *                           Trié par gravité.
 *
 *  3. 👤 Managers         — Par manager : revenus, sessions, moyenne/session,
 *                           cette semaine vs semaine précédente,
 *                           score anomalies. Qui progresse, qui régresse ?
 *
 *  4. 📋 Sessions         — Historique complet, du plus récent au plus ancien.
 *                           Auditez n'importe qui en filtrant sur "Manager".
 *
 *  5. 🔒 Shifts           — Contrôle de caisse : revenu enregistré vs calculé.
 *                           Écart > 0 = appeler le manager.
 */

import { ipcMain, app, shell } from 'electron'
import db from '../db/client'
import { runMigrations, seedAdmin, seedStations } from '../db/seed'
import path from 'path'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function desktopPath(): string {
  try { return app.getPath('desktop') } catch { return app.getPath('userData') }
}

function fmtDate(val: string | number | null | undefined): string {
  if (val == null) return '—'
  try {
    const d = typeof val === 'number' ? new Date(val * 1000) : new Date(val)
    if (isNaN(d.getTime())) return String(val)
    return d.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })
  } catch { return String(val) }
}

function fmtDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

/** Returns a rounded number — numeric cells stay numeric for Excel */
function n(val: number | null | undefined): number {
  return val != null ? Math.round(Number(val) * 100) / 100 : 0
}

function typeLabel(t: string): string {
  return t === 'match' ? 'Match' : t === 'temps' ? 'Temps prépayé' : 'Jeu libre'
}

/** "↑ +12%" / "↓ -5%" / "= 0%" */
function trend(current: number, previous: number): string {
  if (previous === 0 && current === 0) return '= 0%'
  if (previous === 0) return '↑ +100%'
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct > 0)  return `↑ +${pct}%`
  if (pct < 0)  return `↓ ${pct}%`
  return '= 0%'
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0
  if (previous === 0) return 100
  return Math.round(((current - previous) / previous) * 100)
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

function fetchPeriod(startDate: string, endDate: string) {
  return db.prepare(`
    SELECT
      COUNT(*)                                                AS sessions,
      COALESCE(SUM(total_amount), 0)                         AS revenue,
      SUM(CASE WHEN type='match' THEN 1 ELSE 0 END)          AS nb_match,
      SUM(CASE WHEN type='temps' THEN 1 ELSE 0 END)          AS nb_temps,
      SUM(CASE WHEN type='libre' THEN 1 ELSE 0 END)          AS nb_libre,
      SUM(CASE WHEN total_amount=0 AND type!='libre' THEN 1 ELSE 0 END) AS zero_mad,
      AVG(ABS(COALESCE(ended_at_unix,0) - COALESCE(started_at_unix,0)
            - COALESCE(paused_duration,0)))                  AS avg_duration_sec
    FROM sessions
    WHERE status='ended'
      AND DATE(started_at) >= ?
      AND DATE(started_at) <= ?
  `).get(startDate, endDate) as any
}

function fetchManagerPeriod(managerId: number, startDate: string, endDate: string) {
  return db.prepare(`
    SELECT
      COUNT(*)                                                AS sessions,
      COALESCE(SUM(total_amount), 0)                         AS revenue,
      SUM(CASE WHEN total_amount=0 AND type!='libre' THEN 1 ELSE 0 END) AS zero_mad
    FROM sessions
    WHERE manager_id=? AND status='ended'
      AND DATE(started_at) >= ?
      AND DATE(started_at) <= ?
  `).get(managerId, startDate, endDate) as any
}

// ─── Date ranges ──────────────────────────────────────────────────────────────

function buildRanges() {
  const today = new Date()
  const fmt   = (d: Date) => d.toISOString().slice(0, 10)
  const dow   = today.getDay() === 0 ? 6 : today.getDay() - 1   // 0=Mon

  const thisWeekStart  = fmt(new Date(today.getTime() - dow * 86400000))
  const thisWeekEnd    = fmt(today)
  const lastWeekStart  = fmt(new Date(today.getTime() - (dow + 7) * 86400000))
  const lastWeekEnd    = fmt(new Date(today.getTime() - (dow + 1) * 86400000))
  const thisMonStart   = fmt(new Date(today.getFullYear(), today.getMonth(), 1))
  const thisMonEnd     = fmt(today)
  const lastMonStart   = fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1))
  const lastMonEnd     = fmt(new Date(today.getFullYear(), today.getMonth(), 0))

  return { thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd,
           thisMonStart, thisMonEnd, lastMonStart, lastMonEnd }
}

// ─── Sheet 1: Vue d'ensemble ──────────────────────────────────────────────────

function buildOverviewRows(): object[] {
  const R  = buildRanges()
  const tw = fetchPeriod(R.thisWeekStart, R.thisWeekEnd)
  const lw = fetchPeriod(R.lastWeekStart, R.lastWeekEnd)
  const tm = fetchPeriod(R.thisMonStart,  R.thisMonEnd)
  const lm = fetchPeriod(R.lastMonStart,  R.lastMonEnd)
  const al = fetchPeriod('2000-01-01',    todayStr())

  const avgMin = (sec: number | null) => sec && sec > 0 ? Math.round(sec / 60) : 0

  const row = (
    label: string,
    twV: number, lwV: number,
    tmV: number, lmV: number,
    alV: number,
  ) => ({
    'Indicateur':          label,
    'Cette semaine':       twV,
    'Sem. précédente':     lwV,
    'Tendance semaine':    trend(twV, lwV),
    'Δ sem. (%)':          pctDelta(twV, lwV),
    'Ce mois':             tmV,
    'Mois précédent':      lmV,
    'Tendance mois':       trend(tmV, lmV),
    'Δ mois (%)':          pctDelta(tmV, lmV),
    'Tout temps':          alV,
  })

  return [
    row('Revenus (MAD)',          n(tw.revenue), n(lw.revenue), n(tm.revenue), n(lm.revenue), n(al.revenue)),
    row('Nombre de sessions',     tw.sessions,   lw.sessions,   tm.sessions,   lm.sessions,   al.sessions),
    row('Durée moy. session (min)',
        avgMin(tw.avg_duration_sec), avgMin(lw.avg_duration_sec),
        avgMin(tm.avg_duration_sec), avgMin(lm.avg_duration_sec),
        avgMin(al.avg_duration_sec)),
    row('Sessions à 0 MAD ⚠️',    tw.zero_mad,   lw.zero_mad,   tm.zero_mad,   lm.zero_mad,   al.zero_mad),
    row('Sessions Match',         tw.nb_match,   lw.nb_match,   tm.nb_match,   lm.nb_match,   al.nb_match),
    row('Sessions Temps prépayé', tw.nb_temps,   lw.nb_temps,   tm.nb_temps,   lm.nb_temps,   al.nb_temps),
    row('Sessions Jeu libre',     tw.nb_libre,   lw.nb_libre,   tm.nb_libre,   lm.nb_libre,   al.nb_libre),
  ]
}

// ─── Sheet 2: Alertes ─────────────────────────────────────────────────────────

function buildAlertsRows(): object[] {
  const rows: object[] = []

  // A — 0 MAD sur sessions payantes
  const zeroAmt = db.prepare(`
    SELECT s.id, s.started_at, s.type,
           s.match_count, s.match_duration, s.prepaid_minutes,
           st.name AS station, u.username AS manager
    FROM sessions s
    JOIN stations st ON s.station_id = st.id
    JOIN users    u  ON s.manager_id  = u.id
    WHERE s.status='ended' AND s.total_amount=0 AND s.type!='libre'
    ORDER BY s.started_at DESC
  `).all() as any[]

  for (const r of zeroAmt) {
    rows.push({
      'Gravité':        'HAUTE',
      'Problème':       '0 MAD encaissé sur session payante',
      'Session N°':     r.id,
      'Date':           fmtDate(r.started_at),
      'Manager':        r.manager,
      'Station':        r.station,
      'Type':           typeLabel(r.type),
      'Détail':         r.type === 'match'
        ? `${r.match_count} match(s) de ${r.match_duration}min`
        : `${r.prepaid_minutes} min prépayées`,
      'Montant (MAD)':  0,
      'À faire':        'Demander une explication au manager',
    })
  }

  // B — Sessions trop courtes (< 2min)
  const tooShort = db.prepare(`
    SELECT s.id, s.started_at, s.type, s.total_amount,
           (s.ended_at_unix - s.started_at_unix) AS dur_sec,
           st.name AS station, u.username AS manager
    FROM sessions s
    JOIN stations st ON s.station_id = st.id
    JOIN users    u  ON s.manager_id  = u.id
    WHERE s.status='ended'
      AND s.started_at_unix > 0 AND s.ended_at_unix > 0
      AND (s.ended_at_unix - s.started_at_unix) < 120
    ORDER BY s.started_at DESC
  `).all() as any[]

  for (const r of tooShort) {
    rows.push({
      'Gravité':        'MOYENNE',
      'Problème':       `Session terminée en ${r.dur_sec}s (< 2 min)`,
      'Session N°':     r.id,
      'Date':           fmtDate(r.started_at),
      'Manager':        r.manager,
      'Station':        r.station,
      'Type':           typeLabel(r.type),
      'Détail':         `Durée réelle : ${r.dur_sec} secondes`,
      'Montant (MAD)':  n(r.total_amount),
      'À faire':        "Vérifier si c'est une erreur ou un test",
    })
  }

  // C — Écarts de caisse dans les shifts
  const shifts = db.prepare(`
    SELECT sh.id, sh.opened_at, sh.opened_at_unix, sh.closed_at_unix,
           sh.total_revenue, sh.manager_id, u.username AS manager
    FROM shifts sh JOIN users u ON sh.manager_id = u.id
    WHERE sh.status='closed'
    ORDER BY sh.opened_at_unix DESC
  `).all() as any[]

  for (const sh of shifts as any[]) {
    const recalc = db.prepare(`
      SELECT COALESCE(SUM(total_amount),0) AS rev, COUNT(*) AS cnt
      FROM sessions
      WHERE manager_id=? AND status='ended'
        AND ended_at_unix >= ? AND ended_at_unix <= ?
    `).get(sh.manager_id, sh.opened_at_unix, sh.closed_at_unix ?? sh.opened_at_unix) as any

    const recorded   = n(sh.total_revenue)
    const calculated = n(recalc.rev)
    const diff       = Math.round(Math.abs(recorded - calculated) * 100) / 100

    if (diff > 0.01) {
      rows.push({
        'Gravité':        diff > 50 ? 'HAUTE' : 'MOYENNE',
        'Problème':       `Écart de caisse shift #${sh.id}`,
        'Session N°':     `Shift #${sh.id}`,
        'Date':           fmtDate(sh.opened_at),
        'Manager':        sh.manager,
        'Station':        '—',
        'Type':           '—',
        'Détail':         `Enregistré : ${recorded} MAD | Calculé : ${calculated} MAD | Manquant : ${diff} MAD (${recalc.cnt} sessions)`,
        'Montant (MAD)':  diff,
        'À faire':        'Comparer les sessions du shift avec le montant remis',
      })
    }
  }

  if (rows.length === 0) {
    return [{
      'Gravité': '✅ Aucune anomalie', 'Problème': 'Aucune anomalie détectée',
      'Session N°': '—', 'Date': fmtDate(new Date().toISOString()),
      'Manager': '—', 'Station': '—', 'Type': '—',
      'Détail': `Rapport généré le ${fmtDate(new Date().toISOString())}`,
      'Montant (MAD)': 0, 'À faire': '—',
    }]
  }

  return rows
}

// ─── Sheet 3: Managers ────────────────────────────────────────────────────────

function buildManagersRows(): object[] {
  const R        = buildRanges()
  const managers = db.prepare(
    `SELECT id, username FROM users WHERE role='manager' ORDER BY username`
  ).all() as any[]

  return managers.map(m => {
    const tw  = fetchManagerPeriod(m.id, R.thisWeekStart, R.thisWeekEnd)
    const lw  = fetchManagerPeriod(m.id, R.lastWeekStart, R.lastWeekEnd)
    const tm  = fetchManagerPeriod(m.id, R.thisMonStart,  R.thisMonEnd)
    const al  = fetchManagerPeriod(m.id, '2000-01-01',    todayStr())

    const shifts = db.prepare(
      `SELECT COUNT(*) AS cnt FROM shifts WHERE manager_id=? AND status='closed'`
    ).get(m.id) as any

    const caisseMismatches = (db.prepare(`
      SELECT COUNT(*) AS cnt FROM (
        SELECT sh.id,
               ABS(sh.total_revenue - (
                 SELECT COALESCE(SUM(s.total_amount),0)
                 FROM sessions s
                 WHERE s.manager_id=sh.manager_id AND s.status='ended'
                   AND s.ended_at_unix >= sh.opened_at_unix
                   AND s.ended_at_unix <= COALESCE(sh.closed_at_unix, sh.opened_at_unix)
               )) AS diff
        FROM shifts sh WHERE sh.manager_id=? AND sh.status='closed'
        HAVING diff > 0.01
      )
    `).get(m.id) as any).cnt

    const avgPerSession = al.sessions > 0
      ? Math.round((al.revenue / al.sessions) * 100) / 100
      : 0

    return {
      'Manager':                        m.username,
      'Revenus cette semaine (MAD)':    n(tw.revenue),
      'Sessions cette semaine':         tw.sessions,
      'Revenus sem. préc. (MAD)':       n(lw.revenue),
      'Sessions sem. préc.':            lw.sessions,
      'Tendance revenus':               trend(tw.revenue, lw.revenue),
      'Tendance sessions':              trend(tw.sessions, lw.sessions),
      'Revenus ce mois (MAD)':          n(tm.revenue),
      'Sessions ce mois':               tm.sessions,
      'Revenus total (MAD)':            n(al.revenue),
      'Sessions total':                 al.sessions,
      'Moy. par session (MAD)':         avgPerSession,
      'Nb shifts':                      shifts.cnt,
      'Sessions à 0 MAD (total)':       al.zero_mad,
      'Écarts caisse (nb shifts)':      caisseMismatches,
      'Score anomalies':                al.zero_mad + caisseMismatches,
    }
  })
}

// ─── Sheet 4: Sessions ────────────────────────────────────────────────────────

function buildSessionsRows(): object[] {
  const rows = db.prepare(`
    SELECT s.id, s.started_at, s.ended_at,
           s.started_at_unix, s.ended_at_unix, s.paused_duration,
           s.type, s.match_count, s.match_duration, s.prepaid_minutes,
           s.total_amount, s.note,
           st.name AS station, u.username AS manager
    FROM sessions s
    JOIN stations st ON s.station_id = st.id
    JOIN users    u  ON s.manager_id  = u.id
    WHERE s.status='ended'
    ORDER BY s.started_at_unix DESC
  `).all() as any[]

  return rows.map(r => {
    const durSec = (r.ended_at_unix && r.started_at_unix > 0)
      ? r.ended_at_unix - r.started_at_unix - (r.paused_duration ?? 0)
      : null

    const detail =
      r.type === 'match' ? `${r.match_count} match(s) × ${r.match_duration}min`
      : r.type === 'temps' ? `${r.prepaid_minutes} min prépayées`
      : fmtDuration(durSec)

    let alerte = ''
    if (r.type !== 'libre' && (r.total_amount ?? 0) === 0) alerte = '⚠️ 0 MAD encaissé'
    else if (durSec !== null && durSec < 120)               alerte = '⚠️ Durée < 2min'

    return {
      'N° Session':     r.id,
      'Date début':     fmtDate(r.started_at),
      'Date fin':       fmtDate(r.ended_at),
      'Durée nette':    fmtDuration(durSec),
      'Pause (sec)':    r.paused_duration ?? 0,
      'Station':        r.station,
      'Manager':        r.manager,
      'Type':           typeLabel(r.type),
      'Détail':         detail,
      'Montant (MAD)':  n(r.total_amount),
      'Note':           r.note ?? '',
      'Alerte':         alerte,
    }
  })
}

// ─── Sheet 5: Shifts ──────────────────────────────────────────────────────────

function buildShiftsRows(): object[] {
  const rows = db.prepare(`
    SELECT sh.*, u.username AS manager
    FROM shifts sh JOIN users u ON sh.manager_id = u.id
    WHERE sh.status='closed'
    ORDER BY sh.opened_at_unix DESC
  `).all() as any[]

  return rows.map(r => {
    const recalc = db.prepare(`
      SELECT COUNT(*) AS cnt, COALESCE(SUM(total_amount),0) AS rev
      FROM sessions
      WHERE manager_id=? AND status='ended'
        AND ended_at_unix >= ? AND ended_at_unix <= ?
    `).get(r.manager_id, r.opened_at_unix, r.closed_at_unix ?? r.opened_at_unix) as any

    const durSec   = (r.closed_at_unix && r.opened_at_unix)
      ? r.closed_at_unix - r.opened_at_unix - (r.paused_duration ?? 0)
      : null
    const recorded   = n(r.total_revenue)
    const calculated = n(recalc.rev)
    const diff       = Math.round(Math.abs(recorded - calculated) * 100) / 100

    return {
      'N° Shift':                  r.id,
      'Manager':                   r.manager,
      'Ouverture':                 fmtDate(r.opened_at),
      'Fermeture':                 fmtDate(r.closed_at),
      'Durée travaillée':          fmtDuration(durSec),
      'Pause totale':              r.paused_duration ? fmtDuration(r.paused_duration) : '—',
      'Nb sessions':               recalc.cnt,
      'Revenu enregistré (MAD)':   recorded,
      'Revenu calculé (MAD)':      calculated,
      'Écart (MAD)':               diff,
      'Statut':                    diff > 0.01 ? `⚠️ ${diff.toFixed(2)} MAD manquant` : '✅ OK',
    }
  })
}

// ─── Excel builder ────────────────────────────────────────────────────────────

ipcMain.handle('danger:exportExcel', async () => {
  try {
    let ExcelJS: any
    try { ExcelJS = require('exceljs') } catch {
      return { success: false, error: 'exceljs non installé — lancez : npm install exceljs' }
    }

    const wb = new ExcelJS.Workbook()
    wb.creator = 'PlayDesk'
    wb.created = new Date()

    const C = {
      headerBg:    'FF1E1B4B', headerFg:    'FFFFFFFF',
      evenRow:     'FF0F0F1A', oddRow:      'FF141428',
      alertHigh:   'FF3D1500', alertHighFg: 'FFFBBF24',
      alertMed:    'FF1C1400', alertMedFg:  'FFD97706',
      okBg:        'FF0A1F0A', okFg:        'FF4ADE80',
      trendUpBg:   'FF0A1F0A', trendUpFg:   'FF4ADE80',
      trendDownBg: 'FF3D1500', trendDownFg: 'FFFBBF24',
      trendFlatBg: 'FF111128', trendFlatFg: 'FF9998BB',
      overviewKpi: 'FF1A1A36', titleBg:     'FF0A0A1A',
      bodyFg:      'FFDEDEDE', border:      'FF2A2A3A',
    }

    const solidFill = (argb: string) =>
      ({ type: 'pattern', pattern: 'solid', fgColor: { argb } } as any)

    const thinBorder = {
      top:    { style: 'thin', color: { argb: C.border } },
      left:   { style: 'thin', color: { argb: C.border } },
      bottom: { style: 'thin', color: { argb: C.border } },
      right:  { style: 'thin', color: { argb: C.border } },
    } as any

    function trendFill(val: string) {
      if (val.startsWith('↑')) return { bg: C.trendUpBg,   fg: C.trendUpFg }
      if (val.startsWith('↓')) return { bg: C.trendDownBg, fg: C.trendDownFg }
      return                          { bg: C.trendFlatBg, fg: C.trendFlatFg }
    }

    // ── Sheet 1: Vue d'ensemble ───────────────────────────────────────────────
    ;(() => {
      const ws = wb.addWorksheet("📊 Vue d'ensemble")
      ws.views = [{ state: 'frozen', ySplit: 2, showGridLines: false }]

      // Title
      ws.mergeCells(1, 1, 1, 10)
      const title = ws.getCell(1, 1)
      title.value     = `PlayDesk — Rapport de progression   ·   ${fmtDate(new Date().toISOString())}`
      title.fill      = solidFill(C.titleBg)
      title.font      = { bold: true, size: 12, color: { argb: 'FF818CF8' }, name: 'Calibri' }
      title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      ws.getRow(1).height = 26

      // Column headers
      const headers = [
        'Indicateur',
        'Cette semaine', 'Sem. précédente', 'Tendance semaine', 'Δ sem. (%)',
        'Ce mois',       'Mois précédent',  'Tendance mois',    'Δ mois (%)',
        'Tout temps',
      ]
      headers.forEach((h, i) => {
        const cell = ws.getCell(2, i + 1)
        cell.value     = h
        cell.fill      = solidFill(C.headerBg)
        cell.font      = { bold: true, color: { argb: C.headerFg }, size: 10, name: 'Calibri' }
        cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', indent: i === 0 ? 1 : 0 }
        cell.border    = thinBorder
      })
      ws.getRow(2).height = 22

      buildOverviewRows().forEach((r: any, idx) => {
        const vals = [
          r['Indicateur'],
          r['Cette semaine'],    r['Sem. précédente'],
          r['Tendance semaine'], r['Δ sem. (%)'],
          r['Ce mois'],          r['Mois précédent'],
          r['Tendance mois'],    r['Δ mois (%)'],
          r['Tout temps'],
        ]
        const exRow = ws.getRow(idx + 3)
        exRow.height = 20

        vals.forEach((v, ci) => {
          const cell     = ws.getCell(idx + 3, ci + 1)
          cell.value     = v
          cell.border    = thinBorder
          const isTrend  = ci === 3 || ci === 7
          const isDelta  = ci === 4 || ci === 8
          const isLabel  = ci === 0
          const isAlert  = isLabel && String(v).includes('⚠️')

          if (isTrend) {
            const { bg, fg } = trendFill(String(v ?? ''))
            cell.fill      = solidFill(bg)
            cell.font      = { color: { argb: fg }, bold: true, size: 10, name: 'Calibri' }
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
          } else if (isLabel) {
            cell.fill      = solidFill(isAlert ? C.alertMed : C.overviewKpi)
            cell.font      = { color: { argb: isAlert ? C.alertMedFg : C.bodyFg }, bold: isAlert, size: 10, name: 'Calibri' }
            cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
          } else {
            cell.fill      = solidFill(idx % 2 === 0 ? C.evenRow : C.oddRow)
            cell.font      = { color: { argb: C.bodyFg }, size: 10, name: 'Calibri' }
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
            if (typeof v === 'number' && !isDelta) cell.numFmt = '#,##0.00'
            if (isDelta && typeof v === 'number')  cell.numFmt = '+0;-0;0'
          }
        })
      })

      const colWidths = [28, 16, 18, 18, 11, 15, 15, 14, 11, 13]
      colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w })
    })()

    // ── Generic sheet builder (sheets 2–5) ────────────────────────────────────
    function addSheet(
      name: string,
      rows: object[],
      opts: { alertCols?: string[]; numCols?: string[]; trendCols?: string[] } = {}
    ) {
      const ws = wb.addWorksheet(name)
      if (!rows.length) { ws.addRow(['Aucune donnée']); return }

      const headers   = Object.keys(rows[0])
      const alertSet  = new Set(opts.alertCols ?? [])
      const numSet    = new Set(opts.numCols   ?? [])
      const trendSet  = new Set(opts.trendCols ?? [])

      // Header row
      const hRow = ws.addRow(headers)
      hRow.height = 22
      hRow.eachCell((cell: any) => {
        cell.fill      = solidFill(C.headerBg)
        cell.font      = { bold: true, color: { argb: C.headerFg }, size: 10, name: 'Calibri' }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border    = thinBorder
      })

      // Data rows
      rows.forEach((r: any, idx) => {
        const isHigh = opts.alertCols?.some(c => String(r[c] ?? '').includes('HAUTE') || String(r[c] ?? '').includes('⚠️'))
        const isMed  = !isHigh && opts.alertCols?.some(c => String(r[c] ?? '').includes('MOYENNE'))
        const isOk   = opts.alertCols?.some(c => String(r[c] ?? '').startsWith('✅'))
        const defBg  = idx % 2 === 0 ? C.evenRow : C.oddRow

        const dataRow = ws.addRow(Object.values(r))
        dataRow.height = 18

        dataRow.eachCell((cell: any, ci: number) => {
          const col = headers[ci - 1]
          cell.border = thinBorder

          if (trendSet.has(col)) {
            const { bg, fg } = trendFill(String(cell.value ?? ''))
            cell.fill      = solidFill(bg)
            cell.font      = { color: { argb: fg }, bold: true, size: 10, name: 'Calibri' }
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
          } else {
            const bg = isHigh ? C.alertHigh : isMed ? C.alertMed : isOk ? C.okBg : defBg
            const fg = isHigh ? C.alertHighFg : isMed ? C.alertMedFg : isOk ? C.okFg : C.bodyFg
            cell.fill      = solidFill(bg)
            cell.font      = { color: { argb: fg }, size: 10, name: 'Calibri' }
            cell.alignment = { vertical: 'middle', horizontal: numSet.has(col) ? 'right' : 'left' }
            if (numSet.has(col) && typeof cell.value === 'number') cell.numFmt = '#,##0.00'
          }
        })
      })

      // Auto column widths
      ws.columns.forEach((col: any, i: number) => {
        let max = String(headers[i] ?? '').length + 2
        col.eachCell?.({ includeEmpty: false }, (cell: any) => {
          max = Math.min(45, Math.max(max, String(cell.value ?? '').length + 2))
        })
        col.width = max
      })

      ws.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }]
    }

    addSheet('🚨 Alertes', buildAlertsRows(), {
      alertCols: ['Gravité'],
      numCols:   ['Montant (MAD)'],
    })

    addSheet('👤 Managers', buildManagersRows(), {
      numCols:   [
        'Revenus cette semaine (MAD)', 'Revenus sem. préc. (MAD)',
        'Revenus ce mois (MAD)', 'Revenus total (MAD)', 'Moy. par session (MAD)',
      ],
      trendCols: ['Tendance revenus', 'Tendance sessions'],
    })

    addSheet('📋 Sessions', buildSessionsRows(), {
      alertCols: ['Alerte'],
      numCols:   ['Montant (MAD)', 'Pause (sec)'],
    })

    addSheet('🔒 Shifts', buildShiftsRows(), {
      alertCols: ['Statut'],
      numCols:   ['Revenu enregistré (MAD)', 'Revenu calculé (MAD)', 'Écart (MAD)'],
    })

    const filePath = path.join(desktopPath(), `PlayDesk-Rapport-${todayStr()}.xlsx`)
    await wb.xlsx.writeFile(filePath)
    shell.openPath(desktopPath())
    return { success: true, path: filePath }

  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

// ─── Reset DB ─────────────────────────────────────────────────────────────────
// La table `license` n'est PAS supprimée intentionnellement.
ipcMain.handle('danger:resetDb', async () => {
  try {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS shifts;
      DROP TABLE IF EXISTS stations;
      DROP TABLE IF EXISTS users;
      PRAGMA foreign_keys = ON;
    `)
    runMigrations()
    seedAdmin()
    seedStations()
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

// ─── Relaunch ─────────────────────────────────────────────────────────────────
ipcMain.handle('danger:relaunch', async () => {
  app.relaunch()
  app.exit(0)
})