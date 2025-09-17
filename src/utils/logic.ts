import { Child, Household, LedgerEntry, Settings } from '../types'
import { hmToMinutes, isWeekend, toYMD } from './date'

export function getDailyCapMinutes(child: Child, date: Date, settings: Settings) {
  if (isWeekend(date)) return settings.weekendCapMinutes
  return settings.schooldayCapMinutes
}

export function getCutoffMinutes(child: Child, date: Date, settings: Settings) {
  const bed = isWeekend(date) ? child.bedtimes.weekend : child.bedtimes.school
  const off = hmToMinutes(bed) - settings.noScreenBufferMinutes
  return Math.max(0, off)
}

export function calcBalancePoints(ledger: LedgerEntry[], childId: string) {
  return ledger.filter(l => l.childId === childId).reduce((sum, l) => sum + l.points, 0)
}

export function pointsToDollars(points: number, settings: Settings) {
  return Math.floor(points / settings.pointsPerDollar)
}

export function dollarsToPoints(dollars: number, settings: Settings) {
  return Math.floor(dollars * settings.pointsPerDollar)
}

export function spentScreenMinutesOnDate(ledger: LedgerEntry[], childId: string, ymd: string, settings: Settings) {
  const blocks = ledger.filter(l => l.childId === childId && l.date === ymd && l.type === 'spend' && l.code === 'SCREEN_BLOCK')
  // 1 point per minute
  const minutes = blocks.reduce((acc, b) => acc + Math.abs(b.points), 0) // points == minutes
  return minutes
}

export function spentScreenMinutesFromSessions(screenTimeSessions: Record<string, any>, childId: string, ymd: string) {
  const session = screenTimeSessions[childId]
  if (!session) return 0
  
  const now = Date.now()
  const sessionDate = new Date(session.startTime).toISOString().slice(0, 10)
  
  // Only count if session is from today
  if (sessionDate !== ymd) return 0
  
  let elapsedMs = now - session.startTime
  
  // Subtract total paused time
  if (session.status === 'paused' && session.pausedAt) {
    elapsedMs -= (now - session.pausedAt)
  }
  elapsedMs -= session.totalPausedTime || 0
  
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))
  
  // Return the actual time used (not remaining)
  return Math.min(Math.max(0, elapsedMinutes), session.totalMinutes)
}

export function spentScreenMinutesFromLedger(ledger: LedgerEntry[], childId: string, ymd: string) {
  // Count screen time usage from ledger entries
  const screenTimeEntries = ledger.filter(l => 
    l.childId === childId && 
    l.date === ymd && 
    l.type === 'spend' && 
    l.code === 'SCREEN_TIME_USED'
  )
  
  return screenTimeEntries.reduce((total, entry) => total + Math.abs(entry.points), 0)
}

export function extrasEarnedOnDate(ledger: LedgerEntry[], childId: string, ymd: string) {
  return ledger.filter(l => l.childId === childId && l.date === ymd && l.type === 'earn' && l.code.startsWith('EXTRA_'))
    .reduce((acc, e) => acc + e.points, 0)
}

export function baselineDone(ledger: LedgerEntry[], childId: string, ymd: string, code: string) {
  return ledger.some(l => l.childId === childId && l.date === ymd && l.code === code)
}

export function teamBonusGiven(ledger: LedgerEntry[], ymd: string) {
  return ledger.some(l => l.date === ymd && l.code === 'TEAM_BONUS')
}

export function lockoutActiveToday(ledger: LedgerEntry[], childId: string, ymd: string) {
  const todays = ledger.filter(l => l.childId === childId && l.date === ymd)
  const lastLock = todays.filter(l => l.type === 'lockout').pop()
  const lastReset = todays.filter(l => l.type === 'reset').pop()
  if (!lastLock) return false
  if (!lastReset) return true
  return lastReset.ts < lastLock.ts ? true : false
}

export function greenDay(ledger: LedgerEntry[], childId: string, ymd: string) {
  // No lockout entries that persist without reset
  return !lockoutActiveToday(ledger, childId, ymd)
}

export function pointsForTask(code: string, settings: Settings) {
  const t = settings.baselineTasks.concat(settings.extraTasks).find(t => t.code === code)
  return t?.points ?? 0
}

export function canStartBlockNow(child: Child, date: Date, nowMinutes: number, spentToday: number, settings: Settings) {
  const cap = getDailyCapMinutes(child, date, settings)
  const cutoff = getCutoffMinutes(child, date, settings)
  const block = settings.blockMinutes // 30
  if (spentToday + block > cap) return { ok: false, reason: `Daily cap (${cap}m) would be exceeded.` }
  if (nowMinutes + block > cutoff) return { ok: false, reason: `Block would end after cut-off (${Math.floor(cutoff/60)}:${String(cutoff%60).padStart(2,'0')}).` }
  return { ok: true }
}

export function ymd(d: Date) {
  return toYMD(d)
}
