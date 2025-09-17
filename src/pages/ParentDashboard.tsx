import { Link } from 'react-router-dom'
import { useApp } from '../state/store'
import { todayYMD, formatTime } from '../utils/date'
import { calcBalancePoints, getCutoffMinutes, getDailyCapMinutes, spentScreenMinutesFromSessions, spentScreenMinutesFromLedger, teamBonusGiven, baselineDone } from '../utils/logic'
import TaskButtons from '../components/TaskButtons'
import Timer from '../components/Timer'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { useMemo, useState } from 'react'
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

  const giveTeamBonus = () => {
    if (teamBonusGiven(ledger, ymd)) return
    const allBaselinesDoneFor = (childId: string) => settings.baselineTasks.every(t => baselineDone(ledger, childId, ymd, t.code))
    const both = household.children.every(c => allBaselinesDoneFor(c.id))
    if (!both) { alert('Both children need all baselines done to give team bonus.'); return }
    household.children.forEach(c => app.addEarn(c.id, 'TEAM_BONUS', 'Team bonus (both finished baselines)', settings.teamBonusPoints))
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
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <DashboardCard
          title="Pending Requests"
          description="Children's requests waiting for approval"
          headerAction={
            <Badge variant="warning">
              {pendingRequests} pending
            </Badge>
          }
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
                            app.addEarn(child.id, taskCode, e.label.replace('Request: ', ''), 10)
                            app.removeLedger(e.id)
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
                            app.addSpend(child.id, 'SCREEN_APPROVED', `Approved: ${e.label}`, cost)
                            app.startScreenTime(child.id, minutes)
                            app.removeLedger(e.id)
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
                            alert('Screen time paused for ' + child.name)
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
                          onClick={() => {
                            if (confirm(`Approve $${request.amount} cash-out for ${request.childName}? This will deduct ${request.points} points.`)) {
                              app.approveCashOut(request.id, true)
                              alert(`Approved $${request.amount} cash-out for ${request.childName}`)
                            }
                          }}
                        >
                          ✓ Approve
                        </ActionButton>
                        <ActionButton
                          variant="deny"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Reject $${request.amount} cash-out request from ${request.childName}?`)) {
                              app.approveCashOut(request.id, false)
                              alert(`Rejected cash-out request from ${request.childName}`)
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
                          onClick={() => {
                            if (confirm(`End screen time for ${child.name}? Remaining time will be refunded as points.`)) {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              title={child.name}
              description={`Age ${child.age} • Level ${child.level}`}
              headerAction={
                <Link to={`/child/${child.id}`}>
                  <Button variant="outline" size="sm">
                    Child View
                  </Button>
                </Link>
              }
            >
              <div className="space-y-6">
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

                {/* Tasks */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Daily Tasks</h4>
                  <TaskButtons child={child} date={new Date()}/>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <ActionButton
                      variant="warning"
                      size="sm"
                      onClick={() => app.addDeduction(child.id, 'DED_REMINDER', 'Second reminder', 5)}
                    >
                      –5 Reminder
                    </ActionButton>
                    <ActionButton
                      variant="warning"
                      size="sm"
                      onClick={() => app.addDeduction(child.id, 'DED_RUDE', 'Rude language', 10)}
                    >
                      –10 Rude
                    </ActionButton>
                    <ActionButton
                      variant="deny"
                      size="sm"
                      onClick={() => app.addLockout(child.id, 'LYING_SNEAK', 30)}
                    >
                      Lockout (–30)
                    </ActionButton>
                    <ActionButton
                      variant="approve"
                      size="sm"
                      onClick={() => app.addReset(child.id)}
                    >
                      Reset Complete
                    </ActionButton>
                  </div>
                </div>

                {/* Screen Time Timer */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Screen Time</h4>
                  <Timer child={child} onSpend={() => {
                    app.addSpend(child.id, 'SCREEN_BLOCK', '30-min internet block', settings.blockMinutes * settings.pointPerMinute)
                  }}/>
                </div>

                {/* Cash Preview */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Cash-out Preview</h4>
                  <CashPreview childId={child.id} />
                </div>
              </div>
            </DashboardCard>
          )
        })}
      </div>

      {/* Team Bonus */}
      <DashboardCard
        title="Team Bonus"
        description="Reward both children when all baselines are complete"
        headerAction={
          <Button 
            variant="default" 
            disabled={teamBonusGiven(ledger, ymd)} 
            onClick={giveTeamBonus}
          >
            Give +{settings.teamBonusPoints} to both
          </Button>
        }
      >
        <div className="text-center py-4">
          <p className="text-gray-600">
            {teamBonusGiven(ledger, ymd) 
              ? "Team bonus already given today!" 
              : "Both children need to complete all baseline tasks to unlock team bonus."
            }
          </p>
        </div>
      </DashboardCard>

      {/* Activity Log */}
      <DashboardCard
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
    <Card className="bg-gradient-to-r from-success-50 to-primary-50 border-success-200">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Current Balance</div>
            <div className="text-2xl font-bold text-primary-600">{balance}</div>
            <div className="text-xs text-gray-500">points</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Available Cash</div>
            <div className="text-2xl font-bold text-success-600">${preview}</div>
            <div className="text-xs text-gray-500">this week</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
          <span>Rate: <Badge variant="secondary">50 pts = $1</Badge></span>
          <span>Weekly cap: <strong>${cap}</strong></span>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Use the Bank Day screen on Sundays to confirm cash-outs.
        </div>
      </CardContent>
    </Card>
  )
}
