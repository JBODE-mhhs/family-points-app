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
  extrasCapSchool: 25,
  extrasCapWeekend: 40,
  bankDay: 5, // Friday (weekend starts Friday)
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  autoBalanceEnabled: false,
  autoResetEnabled: false,
  autoResetTime: '00:00',
  lastAutoResetDate: undefined,
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
  createHousehold: (name: string, children: Array<{ name: string; age: number; weeklyCashCap: number; bedSchool: string; bedWeekend: string }>, parentUsername?: string, parentPassword?: string) => void
  addEarn: (childId: string, code: string, label: string, points: number, verified?: boolean) => void
  addSpend: (childId: string, code: string, label: string, points: number) => void
  addDeduction: (childId: string, code: string, label: string, points: number) => void
  addLockout: (childId: string, reason: string, points: number) => void
  addReset: (childId: string) => void
  removeLedger: (id: string) => void
  updateSettings: (fn: (s: Settings) => Settings) => void
  updateChild: (childId: string, fn: (c: any) => any) => void
  addChild: (name: string, age: number, weeklyCashCap: number, bedSchool: string, bedWeekend: string) => void
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
  approveScreenTime: (requestId: string, childId: string, minutes: number, cost: number, label: string) => void
  addGoal: (childId: string, name: string, targetAmount: number) => void
  updateGoal: (childId: string, goalId: string, name: string, targetAmount: number) => void
  deleteGoal: (childId: string, goalId: string) => void
  deleteChild: (childId: string) => void
}

const nowYMD = () => todayYMD()

export const useApp = create<AppState>()(persist(
  (set, get) => ({
    household: undefined,
    ledger: [],
    timers: {},
    cashOutRequests: [],
    screenTimeSessions: {},
    createHousehold: (name, kids, parentUsername, parentPassword) => set(() => {
      const children = kids.map(k => ({
        id: uuid(),
        name: k.name,
        age: k.age,
        bedtimes: { school: k.bedSchool, weekend: k.bedWeekend },
        level: 1,
        starsThisWeek: 0,
        weeklyCashCap: k.weeklyCashCap,
        goals: []
      }))
      const household: Household = {
        id: uuid(),
        name,
        children,
        settings: defaultSettings(),
        parentCredentials: parentUsername && parentPassword ? {
          username: parentUsername,
          password: parentPassword,
          createdAt: Date.now()
        } : undefined
      }
      return { household }
    }),
    addEarn: (childId, code, label, points, verified) => set((state) => {
      const entry: LedgerEntry = {
        id: uuid(),
        childId,
        date: nowYMD(),
        ts: Date.now(),
        type: 'earn',
        code,
        label,
        points
      }

      // If verified is explicitly set to true, add verification fields
      if (verified === true) {
        entry.verified = true
        entry.verificationTime = Date.now()
      }

      return {
        ledger: state.ledger.concat([entry])
      }
    }),
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
    addChild: (name, age, weeklyCashCap, bedSchool, bedWeekend) => set((state) => ({
      household: state.household ? {
        ...state.household,
        children: state.household.children.concat([{
          id: uuid(),
          name,
          age,
          bedtimes: { school: bedSchool, weekend: bedWeekend },
          level: 1,
          starsThisWeek: 0,
          weeklyCashCap,
          goals: []
        }])
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

      // Define point weights for each difficulty (high tasks worth more)
      // Using a 1:2:3 ratio (low:medium:high)
      const lowWeight = 1
      const mediumWeight = 2
      const highWeight = 3

      // Update tasks for each child separately based on their weekly cap
      const updatedBaselineTasks = settings.baselineTasks.map(task => {
        // Find the child this task belongs to
        const child = children.find(c => c.id === task.childId)
        if (!child) return task // Keep task unchanged if no child found

        // Calculate target points per week for this specific child
        const targetPointsPerWeek = child.weeklyCashCap * settings.pointsPerDollar

        // Count this child's tasks by difficulty level
        const childTasks = [...settings.baselineTasks, ...settings.extraTasks].filter(t => t.childId === child.id)
        const lowCount = childTasks.filter(t => (t.difficulty || 'medium') === 'low').length
        const mediumCount = childTasks.filter(t => (t.difficulty || 'medium') === 'medium').length
        const highCount = childTasks.filter(t => (t.difficulty || 'medium') === 'high').length

        // Calculate total weighted units available per day for this child
        const totalWeightPerDay = (lowCount * lowWeight) + (mediumCount * mediumWeight) + (highCount * highWeight)
        const totalWeightPerWeek = totalWeightPerDay * 7

        if (totalWeightPerDay === 0) return task // No tasks to balance for this child

        // Calculate points per weight unit for this child
        const pointsPerWeightUnit = targetPointsPerWeek / totalWeightPerWeek

        // Calculate actual point values based on difficulty for this child
        const lowPoints = Math.max(1, Math.round(pointsPerWeightUnit * lowWeight))
        const mediumPoints = Math.max(2, Math.round(pointsPerWeightUnit * mediumWeight))
        const highPoints = Math.max(3, Math.round(pointsPerWeightUnit * highWeight))

        // Update this task's points based on its difficulty
        return {
          ...task,
          difficulty: task.difficulty || 'medium',
          points: task.difficulty === 'low' ? lowPoints :
                  task.difficulty === 'high' ? highPoints : mediumPoints
        }
      })

      const updatedExtraTasks = settings.extraTasks.map(task => {
        // Find the child this task belongs to
        const child = children.find(c => c.id === task.childId)
        if (!child) return task // Keep task unchanged if no child found

        // Calculate target points per week for this specific child
        const targetPointsPerWeek = child.weeklyCashCap * settings.pointsPerDollar

        // Count this child's tasks by difficulty level
        const childTasks = [...settings.baselineTasks, ...settings.extraTasks].filter(t => t.childId === child.id)
        const lowCount = childTasks.filter(t => (t.difficulty || 'medium') === 'low').length
        const mediumCount = childTasks.filter(t => (t.difficulty || 'medium') === 'medium').length
        const highCount = childTasks.filter(t => (t.difficulty || 'medium') === 'high').length

        // Calculate total weighted units available per day for this child
        const totalWeightPerDay = (lowCount * lowWeight) + (mediumCount * mediumWeight) + (highCount * highWeight)
        const totalWeightPerWeek = totalWeightPerDay * 7

        if (totalWeightPerDay === 0) return task // No tasks to balance for this child

        // Calculate points per weight unit for this child
        const pointsPerWeightUnit = targetPointsPerWeek / totalWeightPerWeek

        // Calculate actual point values based on difficulty for this child
        const lowPoints = Math.max(1, Math.round(pointsPerWeightUnit * lowWeight))
        const mediumPoints = Math.max(2, Math.round(pointsPerWeightUnit * mediumWeight))
        const highPoints = Math.max(3, Math.round(pointsPerWeightUnit * highWeight))

        // Update this task's points based on its difficulty
        return {
          ...task,
          difficulty: task.difficulty || 'medium',
          points: task.difficulty === 'low' ? lowPoints :
                  task.difficulty === 'high' ? highPoints : mediumPoints
        }
      })

      return {
        household: {
          ...state.household,
          settings: {
            ...settings,
            baselineTasks: updatedBaselineTasks,
            extraTasks: updatedExtraTasks
          }
        }
      }
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
    }),

    approveScreenTime: (requestId: string, childId: string, minutes: number, cost: number, label: string) => set((state) => {
      // Perform all three operations in a single atomic state update
      return {
        // 1. Remove the screen time request from ledger
        ledger: state.ledger
          .filter(l => l.id !== requestId)
          .concat([{
            id: uuid(),
            childId,
            date: nowYMD(),
            ts: Date.now(),
            type: 'spend',
            code: 'SCREEN_APPROVED',
            label: `Approved: ${label}`,
            points: -Math.abs(cost)
          } as LedgerEntry]),

        // 2. Start the screen time session
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
      }
    }),
    addGoal: (childId, name, targetAmount) => set((state) => ({
      household: state.household ? {
        ...state.household,
        children: state.household.children.map(c =>
          c.id === childId
            ? { ...c, goals: [...(c.goals || []), { id: uuid(), name, targetAmount, createdDate: nowYMD() }] }
            : c
        )
      } : state.household
    })),
    updateGoal: (childId, goalId, name, targetAmount) => set((state) => ({
      household: state.household ? {
        ...state.household,
        children: state.household.children.map(c =>
          c.id === childId
            ? { ...c, goals: (c.goals || []).map(g => g.id === goalId ? { ...g, name, targetAmount } : g) }
            : c
        )
      } : state.household
    })),
    deleteGoal: (childId, goalId) => set((state) => ({
      household: state.household ? {
        ...state.household,
        children: state.household.children.map(c =>
          c.id === childId
            ? { ...c, goals: (c.goals || []).filter(g => g.id !== goalId) }
            : c
        )
      } : state.household
    })),
    deleteChild: (childId) => set((state) => ({
      household: state.household ? {
        ...state.household,
        children: state.household.children.filter(c => c.id !== childId)
      } : state.household,
      // Also remove all ledger entries for this child
      ledger: state.ledger.filter(l => l.childId !== childId),
      // Remove cash out requests for this child
      cashOutRequests: state.cashOutRequests.filter(r => r.childId !== childId),
      // Remove screen time sessions for this child
      screenTimeSessions: Object.fromEntries(
        Object.entries(state.screenTimeSessions).filter(([id]) => id !== childId)
      )
    }))
  }),
  { name: 'family-points-app' }
))
