import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import { Child, Household, LedgerEntry, Settings, TimerState, CashOutRequest } from '../types'
import { todayYMD, toYMD } from '../utils/date'

const defaultSettings = (): Settings => ({
  blockMinutes: 30,
  pointPerMinute: 1,
  pointsPerDollar: 50,
  schooldayCapMinutes: 120,
  weekendCapMinutes: 300,
  noScreenBufferMinutes: 30,
  teamBonusPoints: 10,
  extrasCapSchool: 25,
  extrasCapWeekend: 40,
  bankDay: 5, // Friday (weekend starts Friday)
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  autoBalanceEnabled: false,
  baselineTasks: [
    { id: 'b1', code: 'BASE_MORNING', label: 'Morning routine on time', points: 10, category: 'baseline' },
    { id: 'b2', code: 'BASE_AFTER_SCHOOL', label: 'After-school reset', points: 5, category: 'baseline' },
    { id: 'b3', code: 'BASE_HOMEWORK', label: 'Homework complete & checked / Weekend Learning Block', points: 20, category: 'baseline' },
    { id: 'b4', code: 'BASE_READING', label: 'Reading (7yo 20m / 11yo 30m)', points: 10, category: 'baseline' },
    { id: 'b5', code: 'BASE_TIDY', label: '10-minute tidy', points: 5, category: 'baseline' },
  ],
  extraTasks: [
    { id: 'e1', code: 'EXTRA_DISHES', label: 'Dishes', points: 5, category: 'extra' },
    { id: 'e2', code: 'EXTRA_TRASH', label: 'Trash/Recycling', points: 5, category: 'extra' },
    { id: 'e3', code: 'EXTRA_LAUNDRY', label: 'Laundry (fold & put away)', points: 10, category: 'extra' },
    { id: 'e4', code: 'EXTRA_BATH_WIPE', label: 'Wipe bathroom sink & mirror', points: 10, category: 'extra' },
    { id: 'e5', code: 'EXTRA_PREP', label: 'Prep next day (clothes/backpack)', points: 5, category: 'extra' },
    { id: 'e6', code: 'EXTRA_PRACTICE', label: 'Practice (instrument/math/typing 20m)', points: 10, category: 'extra' },
    { id: 'e7', code: 'EXTRA_KINDNESS', label: 'Kindness/Initiative', points: 5, category: 'extra' },
    { id: 'e8', code: 'EXTRA_COPING', label: 'Used coping skill early', points: 5, category: 'extra' },
    { id: 'e9', code: 'EXTRA_ACTIVE', label: 'Sports/active play ≥ 30m', points: 10, category: 'extra' },
    { id: 'e10', code: 'EXTRA_VAC_SWEEP', label: 'Vacuum/Sweep (11+)', points: 10, category: 'extra', ageMin: 10 }
  ],
  deductions: [
    { code: 'DED_REMINDER', label: 'Second reminder', points: -5 },
    { code: 'DED_RUDE', label: 'Rude/disrespectful language', points: -10 },
    { code: 'DED_TIMER_IGNORED', label: 'Timer ignored', points: -10 },
    { code: 'DED_HW_MISSING', label: 'Homework missing/low effort', points: -20 },
  ]
})

export interface AppState {
  household?: Household
  ledger: LedgerEntry[]
  timers: Record<string, TimerState>
  cashOutRequests: CashOutRequest[]
  screenTimeSessions: Record<string, { 
    childId: string; 
    totalMinutes: number; 
    startTime: number; 
    pausedAt?: number; 
    totalPausedTime: number; // Track total time paused
    status: 'running' | 'paused' | 'completed' 
  }>
  // actions
  createHousehold: (name: string, children: Array<{ name: string; age: number; weeklyCashCap: number; bedSchool: string; bedWeekend: string }>) => void
  addEarn: (childId: string, code: string, label: string, points: number) => void
  addSpend: (childId: string, code: string, label: string, points: number) => void
  addDeduction: (childId: string, code: string, label: string, points: number) => void
  addLockout: (childId: string, reason: string, points: number) => void
  addReset: (childId: string) => void
  removeLedger: (id: string) => void
  updateSettings: (fn: (s: Settings) => Settings) => void
  updateChild: (childId: string, fn: (c: any) => any) => void
  startTimer: (childId: string, endTime: number) => void
  clearTimer: (childId: string) => void
  startScreenTime: (childId: string, minutes: number) => void
  pauseScreenTime: (childId: string) => void
  resumeScreenTime: (childId: string) => void
  endScreenTime: (childId: string, refundPoints?: boolean) => void
  verifyTask: (ledgerId: string) => void
  markTaskIncomplete: (ledgerId: string) => void
  autoBalancePoints: () => void
  generateInviteCode: (childId: string) => string
  autoCompleteTasks: () => void
  resetTodayTasks: (childId?: string) => void
  dailyTaskReset: () => void
  requestCashOut: (childId: string, amount: number) => void
  approveCashOut: (requestId: string, approved?: boolean) => void
}

const nowYMD = () => todayYMD()

export const useApp = create<AppState>()(persist(
  (set, get) => ({
    household: undefined,
    ledger: [],
    timers: {},
    cashOutRequests: [],
    screenTimeSessions: {},
    createHousehold: (name, kids) => set(() => {
      const children = kids.map(k => ({
        id: uuid(),
        name: k.name,
        age: k.age,
        bedtimes: { school: k.bedSchool, weekend: k.bedWeekend },
        level: 1,
        starsThisWeek: 0,
        weeklyCashCap: k.weeklyCashCap
      }))
      const household: Household = {
        id: uuid(),
        name,
        children,
        settings: defaultSettings()
      }
      return { household }
    }),
    addEarn: (childId, code, label, points) => set((state) => ({
      ledger: state.ledger.concat([{
        id: uuid(),
        childId,
        date: nowYMD(),
        ts: Date.now(),
        type: code === 'TEAM_BONUS' ? 'bonus' : 'earn',
        code,
        label,
        points
      } as LedgerEntry])
    })),
    addSpend: (childId, code, label, points) => set((state) => ({
      ledger: state.ledger.concat([{
        id: uuid(),
        childId,
        date: nowYMD(),
        ts: Date.now(),
        type: 'spend',
        code,
        label,
        points: -Math.abs(points)
      } as LedgerEntry])
    })),
    addDeduction: (childId, code, label, points) => set((state) => ({
      ledger: state.ledger.concat([{
        id: uuid(),
        childId,
        date: nowYMD(),
        ts: Date.now(),
        type: 'deduction',
        code,
        label,
        points: -Math.abs(points)
      } as LedgerEntry])
    })),
    addLockout: (childId, reason, points) => set((state) => ({
      ledger: state.ledger.concat([{
        id: uuid(),
        childId,
        date: nowYMD(),
        ts: Date.now(),
        type: 'lockout',
        code: reason,
        label: `Lockout: ${reason}`,
        points: -Math.abs(points)
      } as LedgerEntry])
    })),
    addReset: (childId) => set((state) => ({
      ledger: state.ledger.concat([{
        id: uuid(),
        childId,
        date: nowYMD(),
        ts: Date.now(),
        type: 'reset',
        code: 'RESET',
        label: 'Reset complete (Calm → Repair → Plan)',
        points: 0
      } as LedgerEntry])
    })),
    removeLedger: (id) => set((state) => ({ ledger: state.ledger.filter(l => l.id !== id) })),
    updateSettings: (fn) => set((state) => ({
      household: state.household ? { ...state.household, settings: fn(state.household.settings) } : state.household
    })),
    updateChild: (childId, fn) => set((state) => ({
      household: state.household ? {
        ...state.household,
        children: state.household.children.map(c => c.id === childId ? fn({ ...c }) : c)
      } : state.household
    })),
    startTimer: (childId, endTime) => set((state) => ({
      timers: { ...state.timers, [childId]: { status: 'running', childId, endTime, startedAt: Date.now() } }
    })),
    clearTimer: (childId) => set((state) => {
      const { [childId]: _, ...rest } = state.timers
      return { timers: rest }
    }),
    verifyTask: (ledgerId) => set((state) => ({
      ledger: state.ledger.map(entry => 
        entry.id === ledgerId 
          ? { ...entry, verified: true, verificationTime: Date.now() }
          : entry
      )
    })),
    markTaskIncomplete: (ledgerId) => set((state) => {
      const entry = state.ledger.find(e => e.id === ledgerId)
      if (!entry || entry.type !== 'earn') return state
      
      // Calculate penalty (30% of original points, minimum 3 points)
      const penalty = Math.max(3, Math.floor(entry.points * 0.3))
      
      return {
        ledger: state.ledger.map(e => 
          e.id === ledgerId 
            ? { ...e, verified: false, points: entry.points - penalty }
            : e
        ).concat([{
          id: uuid(),
          childId: entry.childId,
          date: nowYMD(),
          ts: Date.now(),
          type: 'deduction',
          code: 'ACCOUNTABILITY_PENALTY',
          label: `Incomplete task penalty (-${penalty})`,
          points: -penalty
        } as LedgerEntry])
      }
    }),
    autoBalancePoints: () => set((state) => {
      if (!state.household) return state
      
      const settings = state.household.settings
      const children = state.household.children
      
      // Calculate target points for each child (weekly cap * points per dollar)
      const childTargets = children.map(child => ({
        childId: child.id,
        targetPoints: child.weeklyCashCap * settings.pointsPerDollar,
        currentBalance: state.ledger.filter(l => l.childId === child.id).reduce((a, b) => a + b.points, 0)
      }))
      
      // Calculate average target points
      const totalTarget = childTargets.reduce((sum, child) => sum + child.targetPoints, 0)
      const averageTarget = totalTarget / children.length
      
      // Adjust each child's points to match their weekly cap target
      const adjustments = childTargets.map(child => ({
        childId: child.childId,
        adjustment: Math.round((child.targetPoints - child.currentBalance) * 0.1) // 10% adjustment toward target
      }))
      
      const newLedger = [...state.ledger]
      adjustments.forEach(adj => {
        if (adj.adjustment !== 0) {
          newLedger.push({
            id: uuid(),
            childId: adj.childId,
            date: nowYMD(),
            ts: Date.now(),
            type: 'bonus',
            code: 'AUTO_BALANCE',
            label: `Auto-balance toward weekly cap (${adj.adjustment > 0 ? '+' : ''}${adj.adjustment})`,
            points: adj.adjustment
          } as LedgerEntry)
        }
      })
      
      return { ledger: newLedger }
    }),
    generateInviteCode: (childId) => {
      const child = get().household?.children.find(c => c.id === childId)
      if (!child) return ''
      // Simple invite code: child name + random string
      const random = Math.random().toString(36).substring(2, 8).toUpperCase()
      return `${child.name.toUpperCase()}-${random}`
    },
    autoCompleteTasks: () => set((state) => {
      if (!state.household) return state
      
      const today = nowYMD()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayYMD = toYMD(yesterday)
      
      const newLedger = [...state.ledger]
      
      // Auto-complete pending tasks from yesterday
      state.ledger.forEach(entry => {
        if (entry.date === yesterdayYMD && 
            entry.type === 'earn' && 
            entry.verified === undefined) {
          // Auto-verify tasks from yesterday
          const updatedEntry = { ...entry, verified: true, verificationTime: Date.now() }
          const index = newLedger.findIndex(e => e.id === entry.id)
          if (index !== -1) {
            newLedger[index] = updatedEntry
          }
        }
      })
      
      return { ledger: newLedger }
    }),
    startScreenTime: (childId, minutes) => set((state) => ({
      screenTimeSessions: {
        ...state.screenTimeSessions,
        [childId]: {
          childId,
          totalMinutes: minutes,
          startTime: Date.now(),
          totalPausedTime: 0,
          status: 'running'
        }
      }
    })),
    pauseScreenTime: (childId) => set((state) => {
      const session = state.screenTimeSessions[childId]
      if (!session || session.status !== 'running') return state
      
      return {
        screenTimeSessions: {
          ...state.screenTimeSessions,
          [childId]: {
            ...session,
            status: 'paused',
            pausedAt: Date.now()
          }
        }
      }
    }),
    resumeScreenTime: (childId) => set((state) => {
      const session = state.screenTimeSessions[childId]
      if (!session || session.status !== 'paused') return state
      
      const now = Date.now()
      const pausedDuration = now - (session.pausedAt || now)
      
      // Simply add the current pause duration to total paused time and resume
      return {
        screenTimeSessions: {
          ...state.screenTimeSessions,
          [childId]: {
            ...session,
            status: 'running',
            totalPausedTime: session.totalPausedTime + pausedDuration,
            pausedAt: undefined
          }
        }
      }
    }),
    endScreenTime: (childId, refundPoints = false) => set((state) => {
      const session = state.screenTimeSessions[childId]
      const newSessions = { ...state.screenTimeSessions }
      const newLedger = [...state.ledger]
      
      if (session) {
        // Calculate actual time used
        const now = Date.now()
        let elapsedMs = now - session.startTime
        
        // Subtract total paused time
        if (session.status === 'paused' && session.pausedAt) {
          elapsedMs -= (now - session.pausedAt)
        }
        elapsedMs -= session.totalPausedTime || 0
        
        const actualMinutesUsed = Math.floor(elapsedMs / (1000 * 60))
        const remainingMinutes = Math.max(0, session.totalMinutes - actualMinutesUsed)
        
        // Add screen time usage to ledger
        if (actualMinutesUsed > 0) {
          newLedger.push({
            id: uuid(),
            childId,
            date: nowYMD(),
            ts: now,
            type: 'spend',
            code: 'SCREEN_TIME_USED',
            label: `Screen time used (${actualMinutesUsed} min)`,
            points: -actualMinutesUsed // Negative because it's usage
          } as LedgerEntry)
        }
        
        // Calculate refund if requested
        if (refundPoints && remainingMinutes > 0) {
          const refundPoints = remainingMinutes * state.household!.settings.pointPerMinute
          newLedger.push({
            id: uuid(),
            childId,
            date: nowYMD(),
            ts: now,
            type: 'earn',
            code: 'SCREEN_REFUND',
            label: `Screen time refund (${remainingMinutes} min)`,
            points: refundPoints
          } as LedgerEntry)
        }
      }
      
      delete newSessions[childId]
      return { 
        screenTimeSessions: newSessions,
        ledger: newLedger
      }
    }),
    resetTodayTasks: (childId) => set((state) => {
      const today = nowYMD()
      const newLedger = state.ledger.filter(entry => {
        // Keep all entries that are not task completions from today
        if (entry.date !== today) return true
        if (entry.type !== 'earn') return true
        
        // Filter out task completions (baseline and extra tasks)
        const taskCodes = [
          'BASE_MORNING', 'BASE_AFTER_SCHOOL', 'BASE_HOMEWORK', 'BASE_READING', 'BASE_TIDY',
          'EXTRA_DISHES', 'EXTRA_TRASH', 'EXTRA_LAUNDRY', 'EXTRA_BATH_WIPE', 'EXTRA_PREP',
          'EXTRA_PRACTICE', 'EXTRA_KINDNESS', 'EXTRA_COPING', 'EXTRA_ACTIVE', 'EXTRA_VAC_SWEEP'
        ]
        
        if (!taskCodes.includes(entry.code)) return true
        
        // If childId is specified, only reset tasks for that child
        if (childId && entry.childId !== childId) return true
        
        // Remove this task completion
        return false
      })
      
      return { ledger: newLedger }
    }),
    dailyTaskReset: () => set((state) => {
      if (!state.household) return state
      
      const today = nowYMD()
      const newLedger = state.ledger.filter(entry => {
        // Keep all entries that are not task completions from today
        if (entry.date !== today) return true
        if (entry.type !== 'earn') return true
        
        // Filter out task completions (baseline and extra tasks)
        const taskCodes = [
          'BASE_MORNING', 'BASE_AFTER_SCHOOL', 'BASE_HOMEWORK', 'BASE_READING', 'BASE_TIDY',
          'EXTRA_DISHES', 'EXTRA_TRASH', 'EXTRA_LAUNDRY', 'EXTRA_BATH_WIPE', 'EXTRA_PREP',
          'EXTRA_PRACTICE', 'EXTRA_KINDNESS', 'EXTRA_COPING', 'EXTRA_ACTIVE', 'EXTRA_VAC_SWEEP'
        ]
        
        if (!taskCodes.includes(entry.code)) return true
        
        // Remove this task completion (this resets the task for the new day)
        return false
      })
      
      return { ledger: newLedger }
    }),
    
    requestCashOut: (childId: string, amount: number) => set((state) => {
      const child = state.household?.children.find(c => c.id === childId)
      if (!child) return state
      
      const points = amount * state.household!.settings.pointsPerDollar
      const balance = state.ledger.filter(l => l.childId === childId).reduce((a, b) => a + b.points, 0)
      
      if (balance < points) {
        alert(`Not enough points! You need ${points} points but only have ${balance}.`)
        return state
      }
      
      const request: CashOutRequest = {
        id: uuid(),
        childId,
        childName: child.name,
        amount,
        points,
        status: 'pending',
        requestedAt: Date.now()
      }
      
      return { cashOutRequests: state.cashOutRequests.concat([request]) }
    }),
    
    approveCashOut: (requestId: string, approved = true) => set((state) => {
      const request = state.cashOutRequests.find(r => r.id === requestId)
      if (!request) return state
      
      const newRequests = state.cashOutRequests.map(r =>
        r.id === requestId
          ? { ...r, status: (approved ? 'approved' : 'rejected') as 'approved' | 'rejected', processedAt: Date.now(), processedBy: 'Parent' }
          : r
      )
      
      if (approved) {
        // Add the cash-out to the ledger
        const newLedgerEntry: LedgerEntry = {
          id: uuid(),
          childId: request.childId,
          date: nowYMD(),
          ts: Date.now(),
          type: 'cashout',
          code: 'CASH_OUT',
          label: `Cash-out $${request.amount}`,
          points: -request.points
        }
        
        return { 
          cashOutRequests: newRequests,
          ledger: state.ledger.concat([newLedgerEntry])
        }
      }
      
      return { cashOutRequests: newRequests }
    })
  }),
  { name: 'family-points-app' }
))
