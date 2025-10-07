import { Link } from 'react-router-dom'
import { useApp } from '../state/store'
import { todayYMD, formatTime } from '../utils/date'
import { calcBalancePoints, getCutoffMinutes, getDailyCapMinutes, spentScreenMinutesFromSessions, spentScreenMinutesFromLedger } from '../utils/logic'
import TaskButtons from '../components/TaskButtons'
import Timer from '../components/Timer'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useDialogStore } from '../hooks/useDialog'
import { DashboardCard } from '../components/ui/dashboard-card'
import { StatCard } from '../components/ui/stat-card'
import { ActionButton } from '../components/ui/action-button'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Settings
} from 'lucide-react'

export default function ParentDashboard(){
  const app = useApp()
  const household = app.household
  const ledger = app.ledger
  const ymd = todayYMD()
  const dialog = useDialogStore()
  useRealtimeUpdates()
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    child: '',
    type: '',
    labels: [] as string[],
    points: '',
    balance: ''
  })
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  
  if (!household) return (
    <div className="p-6">
      <Card>
        <CardContent className="p-6">
          <p>No household. <Link to="/" className="text-primary-500 hover:underline">Go to Setup</Link></p>
        </CardContent>
      </Card>
    </div>
  )
  
  const settings = household.settings

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Get all unique labels from ledger entries
  const getAllLabels = () => {
    const systemCodes = ['SCREEN_REFUND', 'SCREEN_TIME_USED', 'AUTO_BALANCE', 'TEAM_BONUS']
    const labels = Array.from(new Set(
      ledger
        .filter(l => !systemCodes.includes(l.code))
        .map(l => l.label)
        .filter(Boolean)
    )).sort()
    return labels
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      child: '',
      type: '',
      labels: [],
      points: '',
      balance: ''
    })
  }


  // Calculate dashboard metrics
  const totalPoints = useMemo(() => {
    return household.children.reduce((sum, child) => {
      return sum + calcBalancePoints(ledger, child.id)
    }, 0)
  }, [household.children, ledger])

  const pendingRequests = useMemo(() => {
    return ledger.filter(l => 
      l.date === ymd && 
      l.type === 'earn' && 
      (l.code.startsWith('REQUEST_') || l.code.startsWith('SCREEN_REQUEST') || l.code === 'PAUSE_REQUEST')
    ).length
  }, [ledger, ymd])

  const activeScreenTime = useMemo(() => {
    return Object.keys(app.screenTimeSessions).length
  }, [app.screenTimeSessions])

  const cashOutRequests = useMemo(() => {
    return app.cashOutRequests.filter(r => r.status === 'pending').length
  }, [app.cashOutRequests])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Family Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your family's points and activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="text-sm">
            {household.children.length} children
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Points"
          value={totalPoints.toLocaleString()}
          subtitle="Family balance"
          icon={<TrendingUp className="h-8 w-8 text-primary-500" />}
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          subtitle="Awaiting approval"
          icon={<AlertCircle className="h-8 w-8 text-warning-500" />}
        />
        <StatCard
          title="Active Screen Time"
          value={activeScreenTime}
          subtitle="Current sessions"
          icon={<Clock className="h-8 w-8 text-success-500" />}
        />
        <StatCard
          title="Cash-Out Requests"
          value={cashOutRequests}
          subtitle="Pending approval"
          icon={<DollarSign className="h-8 w-8 text-primary-500" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <DashboardCard
          title="Pending Requests"
          description="Children's requests waiting for approval"
          headerAction={
            <Badge variant="warning">
              {pendingRequests} pending
            </Badge>
          }
          data-section="pending-requests"
        >
          <div className="space-y-4">
            {ledger.filter(l => l.date === ymd && l.type === 'earn' && l.code.startsWith('REQUEST_')).map(e => {
              const child = household.children.find(c => c.id === e.childId)!
              return (
                <Card key={e.id} className="border-l-4 border-l-warning-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{child.name} - {e.label}</h4>
                        <p className="text-sm text-gray-500">Requested at {new Date(e.ts).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <ActionButton
                          variant="approve"
                          size="sm"
                          onClick={() => {
                            const taskCode = e.code.replace('REQUEST_', '')
                            // Find the task in settings to get the correct points
                            const task = [...settings.baselineTasks, ...settings.extraTasks].find(t => t.code === taskCode)
                            const points = task?.points || 10

                            // Atomic operation: add earn entry AND remove request in single state update
                            const newEntry = {
                              id: crypto.randomUUID(),
                              childId: child.id,
                              date: ymd,
                              type: 'earn' as const,
                              code: taskCode,
                              label: e.label.replace('Request: ', ''),
                              points: points,
                              verified: true,
                              timestamp: new Date().toISOString()
                            }

                            useApp.setState((state) => ({
                              ledger: [...state.ledger.filter(l => l.id !== e.id), newEntry]
                            }))
                          }}
                        >
                          ✓ Approve
                        </ActionButton>
                        <ActionButton
                          variant="deny"
                          size="sm"
                          onClick={() => app.removeLedger(e.id)}
                        >
                          ✗ Deny
                        </ActionButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {ledger.filter(l => l.date === ymd && l.type === 'earn' && l.code.startsWith('SCREEN_REQUEST')).map(e => {
              const child = household.children.find(c => c.id === e.childId)!
              const minutes = parseInt(e.label.match(/(\d+)m/)?.[1] || '0')
              const cost = minutes * settings.pointPerMinute
              return (
                <Card key={e.id} className="border-l-4 border-l-primary-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{child.name} - Screen Time Request</h4>
                        <p className="text-sm text-gray-500">{e.label} - Cost: {cost} points</p>
                      </div>
                      <div className="flex space-x-2">
                        <ActionButton
                          variant="approve"
                          size="sm"
                          onClick={() => {
                            console.log('🟢 Approving screen time:', { childId: child.id, minutes, cost, label: e.label })
                            // Use atomic action to prevent race conditions
                            app.approveScreenTime(e.id, child.id, minutes, cost, e.label)
                            console.log('✅ Screen time approved atomically')
                          }}
                        >
                          ✓ Approve
                        </ActionButton>
                        <ActionButton
                          variant="deny"
                          size="sm"
                          onClick={() => app.removeLedger(e.id)}
                        >
                          ✗ Deny
                        </ActionButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {ledger.filter(l => l.date === ymd && l.type === 'earn' && l.code === 'PAUSE_REQUEST').map(e => {
              const child = household.children.find(c => c.id === e.childId)!
              return (
                <Card key={e.id} className="border-l-4 border-l-info-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{child.name} - Pause Request</h4>
                        <p className="text-sm text-gray-500">Wants to pause their screen time</p>
                      </div>
                      <div className="flex space-x-2">
                        <ActionButton
                          variant="approve"
                          size="sm"
                          onClick={() => {
                            app.pauseScreenTime(child.id)
                            app.removeLedger(e.id)
                            // Screen time paused - no alert needed
                          }}
                        >
                          ✓ Pause
                        </ActionButton>
                        <ActionButton
                          variant="deny"
                          size="sm"
                          onClick={() => app.removeLedger(e.id)}
                        >
                          ✗ Deny
                        </ActionButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {pendingRequests === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No pending requests</p>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Cash-Out Requests */}
        {cashOutRequests > 0 && (
          <DashboardCard
            title="💰 Cash-Out Requests"
            description="Children's cash-out requests waiting for approval"
            headerAction={
              <Badge variant="warning">
                {cashOutRequests} pending
              </Badge>
            }
          >
            <div className="space-y-4">
              {app.cashOutRequests.filter(r => r.status === 'pending').map(request => (
                <Card key={request.id} className="border-l-4 border-l-success-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{request.childName} - ${request.amount} Cash-Out</h4>
                        <p className="text-sm text-gray-500">
                          {request.points} points • Requested {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <ActionButton
                          variant="approve"
                          size="sm"
                          onClick={async () => {
                            const confirmed = await dialog.showConfirm(
                              `Approve $${request.amount} cash-out for ${request.childName}?\n\nThis will deduct ${request.points} points.`,
                              'Approve Cash-Out',
                              'success'
                            )
                            if (confirmed) {
                              app.approveCashOut(request.id, true)
                            }
                          }}
                        >
                          ✓ Approve
                        </ActionButton>
                        <ActionButton
                          variant="deny"
                          size="sm"
                          onClick={async () => {
                            const confirmed = await dialog.showConfirm(
                              `Reject $${request.amount} cash-out request from ${request.childName}?`,
                              'Reject Cash-Out',
                              'danger'
                            )
                            if (confirmed) {
                              app.approveCashOut(request.id, false)
                            }
                          }}
                        >
                          ✗ Reject
                        </ActionButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DashboardCard>
        )}

        {/* Screen Time Sessions */}
        <DashboardCard
          title="Screen Time Sessions"
          description="Monitor and control children's screen time"
          headerAction={
            <Badge variant={activeScreenTime > 0 ? "success" : "secondary"}>
              {activeScreenTime} active
            </Badge>
          }
        >
          <div className="space-y-4">
            {Object.values(app.screenTimeSessions).map(session => {
              const child = household.children.find(c => c.id === session.childId)
              if (!child) return null
              
              // Calculate remaining time with seconds
              const now = Date.now()
              let elapsedMs = now - session.startTime
              
              // Subtract total paused time
              if (session.status === 'paused' && session.pausedAt) {
                elapsedMs -= (now - session.pausedAt)
              }
              elapsedMs -= session.totalPausedTime
              
              const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))
              const remainingMinutes = Math.max(0, session.totalMinutes - elapsedMinutes)
              const remainingSeconds = Math.max(0, Math.floor((session.totalMinutes * 60) - (elapsedMs / 1000)))
              const mins = Math.floor(remainingSeconds / 60)
              const secs = remainingSeconds % 60
              
              return (
                <Card key={session.childId} className="border-l-4 border-l-primary-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{child.name} - Screen Time</h4>
                        <p className="text-sm text-gray-500">
                          {session.status === 'running' && `Running - ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} left`}
                          {session.status === 'paused' && `Paused - ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} left`}
                          {session.status === 'completed' && 'Completed'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {session.status === 'running' && (
                          <ActionButton
                            variant="warning"
                            size="sm"
                            onClick={() => app.pauseScreenTime(child.id)}
                          >
                            ⏸️ Pause
                          </ActionButton>
                        )}
                        {session.status === 'paused' && (
                          <ActionButton
                            variant="approve"
                            size="sm"
                            onClick={() => app.resumeScreenTime(child.id)}
                          >
                            ▶️ Resume
                          </ActionButton>
                        )}
                        <ActionButton
                          variant="deny"
                          size="sm"
                          onClick={async () => {
                            const confirmed = await dialog.showConfirm(
                              `End screen time for ${child.name}?`,
                              'End Screen Time',
                              'warning'
                            )
                            if (confirmed) {
                              app.endScreenTime(child.id, true)
                            }
                          }}
                        >
                          ⏹️ End
                        </ActionButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {activeScreenTime === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active screen time sessions</p>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Children Overview */}
      <div id="children-section" className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {household.children.map(child => {
          const balance = calcBalancePoints(ledger, child.id)
          const spentFromSessions = spentScreenMinutesFromSessions(app.screenTimeSessions, child.id, ymd)
          const spentFromLedger = spentScreenMinutesFromLedger(ledger, child.id, ymd)
          const spentToday = spentFromSessions + spentFromLedger
          const cap = getDailyCapMinutes(child, new Date(), settings)
          const cutoff = getCutoffMinutes(child, new Date(), settings)
          const cutoffTime = new Date()
          cutoffTime.setHours(Math.floor(cutoff/60), cutoff%60, 0, 0)
          const cutoffStr = formatTime(cutoffTime, settings.timezone)
          
          return (
            <DashboardCard
              key={child.id}
              padding="none"
            >
              {/* Animated Child Name Header */}
              <div className="relative overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-primary-600/5 to-secondary-600/5" />
                <div className="relative px-6 py-8 text-center border-b border-neutral-100">
                  <motion.h2
                    className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2 tracking-tight"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
                  >
                    {child.name}
                  </motion.h2>
                  <motion.p
                    className="text-sm text-neutral-500 font-medium tracking-wide"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Age {child.age} • Level {child.level}
                  </motion.p>
                </div>
              </div>

              <div className="space-y-6 px-6 pb-6">
                {/* Child Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{balance}</div>
                    <div className="text-xs text-gray-500">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">{spentToday}m</div>
                    <div className="text-xs text-gray-500">Screen Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600">{cutoffStr}</div>
                    <div className="text-xs text-gray-500">Cut-off</div>
                  </div>
                </div>

                {/* Tasks - Compact & Elegant */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wide">Daily Tasks</h4>
                  <div className="space-y-2">
                    {(() => {
                      const baselineTasks = settings.baselineTasks.filter(t => t.childId === child.id)
                      const extraTasks = settings.extraTasks.filter(t => t.childId === child.id && (!t.ageMin || child.age >= t.ageMin))
                      const allTasks = [...baselineTasks, ...extraTasks]

                      return allTasks.map(task => {
                        const entry = ledger.find(l =>
                          l.childId === child.id &&
                          l.date === ymd &&
                          l.code === task.code &&
                          l.type === 'earn'
                        )

                        const isVerified = entry?.verified === true
                        const isPending = entry?.verified === undefined && entry
                        const isIncomplete = entry?.verified === false
                        const isDone = isVerified || isPending || isIncomplete

                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-all ${
                              isVerified
                                ? 'bg-success-50 border-success-200'
                                : isPending
                                ? 'bg-warning-50 border-warning-200'
                                : isIncomplete
                                ? 'bg-error-50 border-error-200'
                                : 'bg-neutral-50 border-neutral-200 hover:border-primary-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isVerified
                                  ? 'bg-success-500 text-white'
                                  : isPending
                                  ? 'bg-warning-500 text-white'
                                  : isIncomplete
                                  ? 'bg-error-500 text-white'
                                  : 'bg-neutral-300 text-neutral-600'
                              }`}>
                                {isVerified ? '✓' : isPending ? '⏳' : isIncomplete ? '✗' : '○'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-900 truncate">{task.label}</p>
                                <p className={`text-xs ${
                                  isVerified ? 'text-success-600' : isPending ? 'text-warning-600' : isIncomplete ? 'text-error-600' : 'text-neutral-500'
                                }`}>
                                  {isVerified ? 'Completed' : isPending ? 'Pending' : isIncomplete ? 'Incomplete' : task.category === 'mandatory' ? 'Mandatory' : 'Optional'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                variant={isVerified ? 'success' : isPending ? 'warning' : isIncomplete ? 'destructive' : 'secondary'}
                                size="sm"
                              >
                                +{task.points}
                              </Badge>
                            </div>
                          </motion.div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Quick Actions - Compact & Elegant */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wide">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => app.addDeduction(child.id, 'DED_REMINDER', 'Second reminder', 5)}
                      className="flex flex-col items-center justify-center px-3 py-3 rounded-lg bg-gradient-to-br from-warning-50 to-warning-100 border-2 border-warning-200 hover:border-warning-300 transition-all"
                    >
                      <span className="text-lg font-bold text-warning-700">–5</span>
                      <span className="text-xs font-medium text-warning-600">Reminder</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => app.addDeduction(child.id, 'DED_RUDE', 'Rude language', 10)}
                      className="flex flex-col items-center justify-center px-3 py-3 rounded-lg bg-gradient-to-br from-warning-50 to-warning-100 border-2 border-warning-200 hover:border-warning-300 transition-all"
                    >
                      <span className="text-lg font-bold text-warning-700">–10</span>
                      <span className="text-xs font-medium text-warning-600">Rude</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => app.addLockout(child.id, 'LYING_SNEAK', 30)}
                      className="flex flex-col items-center justify-center px-3 py-3 rounded-lg bg-gradient-to-br from-error-50 to-error-100 border-2 border-error-200 hover:border-error-300 transition-all"
                    >
                      <span className="text-lg font-bold text-error-700">–30</span>
                      <span className="text-xs font-medium text-error-600">Lockout</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => app.addReset(child.id)}
                      className="flex flex-col items-center justify-center px-3 py-3 rounded-lg bg-gradient-to-br from-success-50 to-success-100 border-2 border-success-200 hover:border-success-300 transition-all"
                    >
                      <span className="text-lg font-bold text-success-700">✓</span>
                      <span className="text-xs font-medium text-success-600">Reset</span>
                    </motion.button>
                  </div>
                </div>

                {/* Screen Time Timer - Compact & Elegant */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wide">Screen Time</h4>
                  <div className="rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200 p-4">
                    <Timer child={child} onSpend={() => {
                      app.addSpend(child.id, 'SCREEN_BLOCK', '30-min internet block', settings.blockMinutes * settings.pointPerMinute)
                    }}/>
                  </div>
                </div>

                {/* Cash Preview - Gradient Style */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wide">Cash-Out Preview</h4>
                  <div className="rounded-xl bg-gradient-to-br from-success-50 via-primary-50 to-secondary-50 border-2 border-success-200 p-5">
                    <CashPreview childId={child.id} />
                  </div>
                </div>
              </div>
            </DashboardCard>
          )
        })}
      </div>

      {/* Activity Log */}
      <DashboardCard
        id="activity-section"
        title="All Activity"
        description="All points earned and spent"
        headerAction={
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            {filtersExpanded ? 'Hide' : 'Show'} Filters
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Filter Controls */}
          {filtersExpanded && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={filters.startDate}
                      onChange={(e) => updateFilter('startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={filters.endDate}
                      onChange={(e) => updateFilter('endDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Child</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={filters.child}
                      onChange={(e) => updateFilter('child', e.target.value)}
                    >
                      <option value="">All Children</option>
                      {household.children.map(child => (
                        <option key={child.id} value={child.name}>{child.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Child</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Label</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Points</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Balance</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledger.filter(l => {
                  const systemCodes = ['SCREEN_REFUND', 'SCREEN_TIME_USED', 'AUTO_BALANCE', 'TEAM_BONUS']
                  if (systemCodes.includes(l.code)) return false
                  return true
                }).slice().sort((a,b)=>b.ts-a.ts).filter(e => {
                  const child = household.children.find(c => c.id === e.childId)
                  if (!child) return false
                  
                  if (filters.startDate || filters.endDate) {
                    const entryDate = new Date(e.ts).toISOString().split('T')[0]
                    if (filters.startDate && entryDate < filters.startDate) return false
                    if (filters.endDate && entryDate > filters.endDate) return false
                  }
                  if (filters.child && child.name !== filters.child) return false
                  if (filters.type && e.type !== filters.type) return false
                  
                  return true
                }).map((e, index, array) => {
                  const child = household.children.find(c => c.id === e.childId)!
                  
                  const childEntries = array.filter(entry => entry.childId === e.childId)
                  const currentEntryIndex = childEntries.findIndex(entry => entry.id === e.id)
                  const entriesUpToThis = childEntries.slice(currentEntryIndex)
                  const runningBalance = entriesUpToThis.reduce((sum, entry) => sum + entry.points, 0)
                  
                  const getStatusBadge = () => {
                    if (e.type === 'earn' && e.verified === true) return <Badge variant="success">✓ Verified</Badge>
                    if (e.type === 'earn' && e.verified === false) return <Badge variant="destructive">✗ Incomplete</Badge>
                    if (e.type === 'earn' && e.verified === undefined) return <Badge variant="warning">⏳ Pending</Badge>
                    return <Badge variant="secondary">{e.type}</Badge>
                  }
                  
                  return (
                    <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{new Date(e.ts).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{child?.name}</td>
                      <td className="py-3 px-4">{getStatusBadge()}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{e.label}</td>
                      <td className={`py-3 px-4 text-sm font-semibold ${e.points>=0? 'text-success-600':'text-error-600'}`}>
                        {e.points>=0? '+' : ''}{e.points}
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold ${runningBalance >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {runningBalance}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-1">
                          {e.type === 'earn' && e.verified === undefined && !['SCREEN_REFUND', 'SCREEN_TIME_USED', 'AUTO_BALANCE', 'TEAM_BONUS'].includes(e.code) && (
                            <>
                              <ActionButton
                                variant="approve"
                                size="sm"
                                onClick={() => app.verifyTask(e.id)}
                              >
                                ✓
                              </ActionButton>
                              <ActionButton
                                variant="deny"
                                size="sm"
                                onClick={() => app.markTaskIncomplete(e.id)}
                              >
                                ✗
                              </ActionButton>
                            </>
                          )}
                          {e.type === 'earn' && e.verified === true && !['SCREEN_REFUND', 'SCREEN_TIME_USED', 'AUTO_BALANCE', 'TEAM_BONUS'].includes(e.code) && (
                            <ActionButton
                              variant="warning"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Undo this completed task? This will remove ${e.points} points from ${child?.name}.`)) {
                                  app.removeLedger(e.id)
                                }
                              }}
                            >
                              Undo
                            </ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardCard>
    </div>
  )
}

function CashPreview({ childId }:{ childId: string }){
  const app = useApp()
  const s = app.household!.settings
  const balance = app.ledger.filter(l => l.childId === childId).reduce((a,b)=>a+b.points,0)
  const child = app.household!.children.find(c => c.id === childId)!
  const maxByPoints = Math.floor(Math.max(0, balance) / s.pointsPerDollar)
  const cap = child.weeklyCashCap
  const preview = Math.min(maxByPoints, cap)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          className="text-center p-3 rounded-lg bg-white/60 border border-primary-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wide">Balance</div>
          <div className="text-3xl font-bold text-primary-600 tracking-tight">{balance}</div>
          <div className="text-xs text-neutral-500 mt-1">points</div>
        </motion.div>
        <motion.div
          className="text-center p-3 rounded-lg bg-white/60 border border-success-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xs font-medium text-neutral-600 mb-1 uppercase tracking-wide">Available</div>
          <div className="text-3xl font-bold text-success-600 tracking-tight">${preview}</div>
          <div className="text-xs text-neutral-500 mt-1">this week</div>
        </motion.div>
      </div>
      <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-white/40 border border-neutral-200">
        <span className="text-xs text-neutral-600">
          Rate: <Badge variant="secondary" size="sm">50 pts = $1</Badge>
        </span>
        <span className="text-xs text-neutral-600">
          Cap: <span className="font-bold text-neutral-900">${cap}/wk</span>
        </span>
      </div>
    </div>
  )
}
