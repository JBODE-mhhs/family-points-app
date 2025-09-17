export type Id = string

export type TaskCategory = 'baseline' | 'extra'

export interface TaskDef {
  id: Id
  code: string
  label: string
  points: number
  category: TaskCategory
  ageMin?: number
}

export interface DeductionDef {
  code: string
  label: string
  points: number // negative number
}

export interface Bedtimes {
  school: string // '21:00' for 9pm
  weekend: string // applies to Sat & Sun
}

export interface Child {
  id: Id
  name: string
  age: number
  bedtimes: Bedtimes
  level: number // 1..4
  starsThisWeek: number
  weeklyCashCap: number // dollars
}

export interface Settings {
  blockMinutes: number // 30
  pointPerMinute: number // 1
  pointsPerDollar: number // 50
  schooldayCapMinutes: number // 120
  weekendCapMinutes: number // 300
  noScreenBufferMinutes: number // 30
  teamBonusPoints: number // 10
  extrasCapSchool: number // +25/day
  extrasCapWeekend: number // +40/day
  bankDay: number // 0=Sun, 1=Mon, ...
  timezone: string // 'America/New_York'
  autoBalanceEnabled: boolean // false
  baselineTasks: TaskDef[]
  extraTasks: TaskDef[]
  deductions: DeductionDef[]
}

export interface Household {
  id: Id
  name: string
  children: Child[]
  settings: Settings
}

export type LedgerType = 'earn' | 'spend' | 'deduction' | 'bonus' | 'lockout' | 'reset' | 'cashout'

export interface LedgerEntry {
  id: Id
  childId: Id
  date: string // YYYY-MM-DD (local)
  ts: number // epoch ms
  type: LedgerType
  code: string
  label: string
  points: number // positive for earns/bonus, negative for spend/deduction/cashout
  meta?: Record<string, any>
  verified?: boolean // true if task was actually completed (for accountability)
  verificationTime?: number // when the task was verified as complete
}

export interface TimerState {
  status: 'idle' | 'running'
  childId?: Id
  endTime?: number // epoch ms
  startedAt?: number // epoch ms
  secondsLeft?: number
}

export interface CashOutRequest {
  id: Id
  childId: Id
  childName: string
  amount: number // dollars requested
  points: number // points to be deducted
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: number // epoch ms
  processedAt?: number // epoch ms
  processedBy?: string // parent name
}
