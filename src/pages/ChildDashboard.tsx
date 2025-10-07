import { Link, useParams } from 'react-router-dom'
import { useApp } from '../state/store'
import { todayYMD, formatTime } from '../utils/date'
import { calcBalancePoints, getDailyCapMinutes, spentScreenMinutesFromSessions, spentScreenMinutesFromLedger } from '../utils/logic'
import ChildTaskDisplay from '../components/ChildTaskDisplay'
import ScreenTimeTimer from '../components/ScreenTimeTimer'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { useState, useEffect } from 'react'
import { DashboardCard } from '../components/ui/dashboard-card'
import { StatCard } from '../components/ui/stat-card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Gamepad2,
  Banknote,
  Sparkles,
  Target
} from 'lucide-react'
import confetti from 'canvas-confetti'

export default function ChildDashboard(){
  const { childId } = useParams()
  const app = useApp()
  const household = app.household
  const [activeTab, setActiveTab] = useState<'tasks' | 'bank' | 'goals'>('tasks')
  useRealtimeUpdates()

  if (!household) return (
    <div className="p-6">
      <Card>
        <CardContent className="p-6">
          <p>No household. <Link to="/" className="text-primary-500 hover:underline">Go to Setup</Link></p>
        </CardContent>
      </Card>
    </div>
  )

  const child = household.children.find(c => c.id === childId)
  if (!child) return (
    <div className="p-6">
      <Card>
        <CardContent className="p-6">
          <p>Child not found.</p>
        </CardContent>
      </Card>
    </div>
  )

  const ymd = todayYMD()
  const balance = calcBalancePoints(app.ledger, child.id)
  const spentFromSessions = spentScreenMinutesFromSessions(app.screenTimeSessions, child.id, ymd)
  const spentFromLedger = spentScreenMinutesFromLedger(app.ledger, child.id, ymd)
  const spentToday = spentFromSessions + spentFromLedger
  const cap = getDailyCapMinutes(child, new Date(), household.settings)

  // Check for active screen time sessions
  const activeScreenTime = app.screenTimeSessions[child.id]
  console.log('🔵 Child dashboard - child.id:', child.id)
  console.log('🔵 Child dashboard - activeScreenTime:', activeScreenTime)
  console.log('🔵 Child dashboard - all sessions:', app.screenTimeSessions)

  return (
    <div className="space-y-6 bg-gradient-to-br from-purple-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {child.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🌟 {child.name}'s Dashboard
        </h1>
        <p className="text-gray-600 text-lg">Track your points and complete your tasks</p>
        <div className="flex items-center justify-center space-x-4 mt-4">
          <Badge variant="secondary" className="text-sm">
            Age {child.age}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Level {child.level}
          </Badge>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Points Balance"
          value={balance.toLocaleString()}
          subtitle="Available to spend"
          icon={<Star className="h-8 w-8 text-yellow-500" />}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
        />
        <StatCard
          title="Screen Time Today"
          value={`${spentToday}m`}
          subtitle={`Max ${cap}m allowed`}
          icon={<Clock className="h-8 w-8 text-blue-500" />}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
        />
        <StatCard
          title="Available Cash"
          value={`$${Math.min(Math.floor(balance / household.settings.pointsPerDollar), child.weeklyCashCap)}`}
          subtitle="This week"
          icon={<DollarSign className="h-8 w-8 text-green-500" />}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
        />
        <StatCard
          title="Achievements"
          value="0"
          subtitle="This week"
          icon={<Sparkles className="h-8 w-8 text-purple-500" />}
          className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
        />
      </div>

      {/* Tab Navigation */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('tasks')}
            >
              <Gamepad2 className="h-5 w-5 inline mr-2" />
              Tasks & Screen Time
            </button>
            <button
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'bank'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('bank')}
            >
              <Banknote className="h-5 w-5 inline mr-2" />
              Bank
            </button>
            <button
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'goals'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('goals')}
            >
              <Target className="h-5 w-5 inline mr-2" />
              Goals
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Tasks */}
          <DashboardCard
            title="📋 Daily Tasks"
            description="Complete these to earn points"
            className="bg-white/80 backdrop-blur-sm"
          >
            <ChildTaskDisplay child={child} date={new Date()}/>
          </DashboardCard>

          {/* Active Screen Time */}
          {activeScreenTime && (
            <DashboardCard
              title="⏰ Active Screen Time"
              description="Your approved screen time session"
              className="bg-white/80 backdrop-blur-sm"
            >
              <ScreenTimeTimer
                childId={child.id}
                minutes={activeScreenTime.totalMinutes}
                onComplete={() => {
                  app.endScreenTime(child.id)
                }}
              />
            </DashboardCard>
          )}

          {/* Screen Time Requests */}
          <DashboardCard
            title="🎮 Request Screen Time"
            description="Request screen time based on your points"
            className="bg-white/80 backdrop-blur-sm"
          >
            <div className="space-y-4">
              {/* Show pending screen time requests */}
              {app.ledger.filter(l =>
                l.childId === child.id &&
                l.date === ymd &&
                l.code === 'SCREEN_REQUEST'
              ).map(request => (
                <div key={request.id} className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900">⏳ {request.label}</p>
                      <p className="text-sm text-yellow-700">Pending Parent Approval</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  You have <strong>{balance}</strong> points available. Each minute costs <strong>{household.settings.pointPerMinute}</strong> point{household.settings.pointPerMinute !== 1 ? 's' : ''}.
                </p>
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Custom Amount (minutes)</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="1"
                    max={Math.floor(balance / household.settings.pointPerMinute)}
                    placeholder="Enter minutes"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-semibold"
                    id="custom-screen-time"
                  />
                  <Button
                    className="bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6"
                    onClick={() => {
                      const input = document.getElementById('custom-screen-time') as HTMLInputElement
                      const minutes = parseInt(input.value || '0', 10)
                      const cost = minutes * household.settings.pointPerMinute

                      if (minutes <= 0) {
                        alert('Please enter a valid number of minutes.')
                        return
                      }

                      if (balance < cost) {
                        alert(`Not enough points! You need ${cost} points but only have ${balance}.`)
                        return
                      }

                      app.addEarn(child.id, 'SCREEN_REQUEST', `Screen time request: ${minutes}m`, 0)
                      input.value = ''
                    }}
                  >
                    Request
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or choose quick options</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[15, 30, 60, 90, 120].map(minutes => {
                  const cost = minutes * household.settings.pointPerMinute
                  const canAfford = balance >= cost

                  return (
                    <Button
                      key={minutes}
                      variant={canAfford ? "default" : "outline"}
                      disabled={!canAfford}
                      className={`h-20 flex flex-col items-center justify-center space-y-1 ${
                        canAfford
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      onClick={() => {
                        if (canAfford) {
                          app.addEarn(child.id, 'SCREEN_REQUEST', `Screen time request: ${minutes}m`, 0)
                          // Request sent - no alert needed
                        } else {
                          alert(`Not enough points! You need ${cost} points but only have ${balance}.`)
                        }
                      }}
                    >
                      <Clock className="h-6 w-6" />
                      <span className="font-semibold">{minutes}m</span>
                      <span className="text-xs">({cost} pts)</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </DashboardCard>
        </div>
      )}

      {activeTab === 'bank' && (
        <BankTab childId={child.id} balance={balance} />
      )}

      {activeTab === 'goals' && (
        <GoalsTab childId={child.id} balance={balance} settings={household.settings} />
      )}
    </div>
  )
}

function BankTab({ childId, balance }: { childId: string, balance: number }) {
  const app = useApp()
  const household = app.household!
  const [requestAmount, setRequestAmount] = useState(1)

  const child = household.children.find(c => c.id === childId)!
  const pointsPerDollar = household.settings.pointsPerDollar
  const maxDollars = Math.min(Math.floor(Math.max(0, balance) / pointsPerDollar), child.weeklyCashCap)

  // Get pending requests for this child
  const pendingRequests = app.cashOutRequests.filter(r =>
    r.childId === childId && r.status === 'pending'
  )

  // Get recent requests (last 7 days)
  const recentRequests = app.cashOutRequests.filter(r =>
    r.childId === childId &&
    r.requestedAt > Date.now() - (7 * 24 * 60 * 60 * 1000)
  ).sort((a, b) => b.requestedAt - a.requestedAt)

  return (
    <div className="space-y-6">
      {/* Request Cash-Out */}
      <DashboardCard
        title="💰 Request Cash-Out"
        description="Convert your points to real money!"
        className="bg-white/80 backdrop-blur-sm"
      >
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              You have <strong>{balance}</strong> points available. {pointsPerDollar} points = $1.00
              {child.weeklyCashCap > 0 && ` (Weekly limit: $${child.weeklyCashCap})`}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount to request ($)</label>
              <input
                type="number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl font-bold"
                min="1"
                max={maxDollars}
                value={requestAmount}
                onChange={(e) => setRequestAmount(Math.min(maxDollars, Math.max(1, parseInt(e.target.value || '1', 10))))}
              />
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Points cost</div>
              <div className="text-4xl font-bold text-purple-600">
                {requestAmount * pointsPerDollar} points
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold text-lg"
            disabled={requestAmount <= 0 || requestAmount > maxDollars}
            onClick={() => {
              app.requestCashOut(childId, requestAmount)
              // Cash-out request sent - no alert needed
            }}
          >
            Request ${requestAmount} Cash-Out
          </Button>
        </div>
      </DashboardCard>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <DashboardCard
          title="⏳ Pending Requests"
          description="Waiting for parent approval"
          className="bg-white/80 backdrop-blur-sm"
        >
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <Card key={request.id} className="border-l-4 border-l-yellow-500 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">${request.amount} ({request.points} points)</div>
                      <div className="text-sm text-gray-500">
                        Requested {new Date(request.requestedAt).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="warning">
                      Pending
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Recent Requests */}
      {recentRequests.length > 0 && (
        <DashboardCard
          title="📋 Recent Requests"
          description="Your cash-out history"
          className="bg-white/80 backdrop-blur-sm"
        >
          <div className="space-y-4">
            {recentRequests.map(request => (
              <Card key={request.id} className="border-l-4 border-l-gray-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">${request.amount} ({request.points} points)</div>
                      <div className="text-sm text-gray-500">
                        {new Date(request.requestedAt).toLocaleString()}
                        {request.processedAt && ` • Processed ${new Date(request.processedAt).toLocaleString()}`}
                      </div>
                    </div>
                    <Badge
                      variant={
                        request.status === 'approved' ? 'success' :
                        request.status === 'rejected' ? 'destructive' : 'warning'
                      }
                    >
                      {request.status === 'approved' ? '✓ Approved' :
                       request.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  )
}

function GoalsTab({ childId, balance, settings }: { childId: string, balance: number, settings: any }) {
  const app = useApp()
  const household = app.household!
  const child = household.children.find(c => c.id === childId)!
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalAmount, setNewGoalAmount] = useState(100)
  const [celebratedGoals, setCelebratedGoals] = useState<string[]>([])

  // Convert points to dollars
  const currentDollars = balance / settings.pointsPerDollar

  // Calculate metrics for a goal
  const calculateMetrics = (goal: any) => {
    const progress = currentDollars
    const remaining = goal.targetAmount - progress
    const percentage = Math.min(100, (progress / goal.targetAmount) * 100)

    // Get average points earned per day (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const recentEarnings = app.ledger.filter(l =>
      l.childId === childId &&
      l.type === 'earn' &&
      l.ts >= sevenDaysAgo &&
      l.points > 0
    )
    const totalEarned = recentEarnings.reduce((sum, l) => sum + l.points, 0)
    const avgPointsPerDay = totalEarned / 7
    const avgDollarsPerDay = avgPointsPerDay / settings.pointsPerDollar

    // Calculate days to goal at current rate
    const daysAtCurrentRate = avgDollarsPerDay > 0 ? Math.ceil(remaining / avgDollarsPerDay) : Infinity

    // Calculate max possible earnings per day (all tasks completed)
    const allTasks = [...settings.baselineTasks, ...settings.extraTasks].filter((t: any) => t.childId === childId)
    const maxPointsPerDay = allTasks.reduce((sum: number, t: any) => sum + t.points, 0)
    const maxDollarsPerDay = maxPointsPerDay / settings.pointsPerDollar
    const daysIfAllTasks = maxDollarsPerDay > 0 ? Math.ceil(remaining / maxDollarsPerDay) : Infinity

    // Calculate 50% completion rate
    const halfDollarsPerDay = maxDollarsPerDay * 0.5
    const daysIfHalfTasks = halfDollarsPerDay > 0 ? Math.ceil(remaining / halfDollarsPerDay) : Infinity

    return {
      progress,
      remaining,
      percentage,
      daysAtCurrentRate,
      daysIfAllTasks,
      daysIfHalfTasks,
      isAchieved: progress >= goal.targetAmount
    }
  }

  // Trigger confetti for achieved goals
  useEffect(() => {
    const goals = child.goals || []
    goals.forEach(goal => {
      const metrics = calculateMetrics(goal)
      if (metrics.isAchieved && !celebratedGoals.includes(goal.id)) {
        // Trigger confetti
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
        })
        setCelebratedGoals(prev => [...prev, goal.id])
      }
    })
  }, [child.goals, celebratedGoals])

  const addGoal = () => {
    if (newGoalName.trim() && newGoalAmount > 0) {
      app.addGoal(childId, newGoalName, newGoalAmount)
      setNewGoalName('')
      setNewGoalAmount(100)
      setShowAddGoal(false)
    }
  }

  const goals = child.goals || []

  return (
    <div className="space-y-6">
      {/* Goals List */}
      {goals.map(goal => {
        const metrics = calculateMetrics(goal)
        return (
          <DashboardCard
            key={goal.id}
            title={`🎯 ${goal.name}`}
            description={`Goal: $${goal.targetAmount}`}
            className={metrics.isAchieved ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300" : "bg-white/80 backdrop-blur-sm"}
          >
            {metrics.isAchieved && (
              <div className="mb-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300 text-center">
                <div className="text-3xl mb-2">🎉 🎊 ✨</div>
                <div className="text-xl font-bold text-yellow-800">Goal Achieved!</div>
                <p className="text-yellow-700">You did it! Talk to your parents about getting your ${goal.targetAmount} reward!</p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-700">Progress</span>
                  <span className="font-bold text-purple-600">{metrics.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${metrics.percentage}%` }}
                  >
                    {metrics.percentage > 10 && (
                      <span className="text-white text-xs font-bold">${metrics.progress.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$0</span>
                  <span>${goal.targetAmount}</span>
                </div>
              </div>

              {/* Metrics */}
              {!metrics.isAchieved && metrics.remaining > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-3">
                      <div className="text-xs text-blue-600 font-semibold mb-1">At Current Rate</div>
                      <div className="text-lg font-bold text-blue-700">
                        {metrics.daysAtCurrentRate === Infinity ? '∞' : metrics.daysAtCurrentRate} days
                      </div>
                      <div className="text-xs text-blue-500">Based on last 7 days</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-3">
                      <div className="text-xs text-green-600 font-semibold mb-1">If All Tasks Done</div>
                      <div className="text-lg font-bold text-green-700">
                        {metrics.daysIfAllTasks === Infinity ? '∞' : metrics.daysIfAllTasks} days
                      </div>
                      <div className="text-xs text-green-500">100% completion daily</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-3">
                      <div className="text-xs text-orange-600 font-semibold mb-1">If 50% Tasks Done</div>
                      <div className="text-lg font-bold text-orange-700">
                        {metrics.daysIfHalfTasks === Infinity ? '∞' : metrics.daysIfHalfTasks} days
                      </div>
                      <div className="text-xs text-orange-500">50% completion daily</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Remaining Amount */}
              {!metrics.isAchieved && (
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">You need </span>
                  <span className="text-xl font-bold text-purple-600">${metrics.remaining.toFixed(2)}</span>
                  <span className="text-sm text-gray-700"> more to reach your goal!</span>
                </div>
              )}

              {/* Delete Goal Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => app.deleteGoal(childId, goal.id)}
                className="w-full"
              >
                Remove Goal
              </Button>
            </div>
          </DashboardCard>
        )
      })}

      {/* Add Goal Section */}
      {!showAddGoal && (
        <Button
          onClick={() => setShowAddGoal(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
          size="lg"
        >
          <Target className="h-5 w-5 mr-2" />
          Add New Goal
        </Button>
      )}

      {showAddGoal && (
        <DashboardCard
          title="✨ Create New Goal"
          description="What are you saving for?"
          className="bg-gradient-to-br from-purple-50 to-cyan-50 border-purple-200"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Goal Name</label>
              <input
                type="text"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="e.g., 3D Printer, Video Game, Bike"
                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Amount ($)</label>
              <input
                type="number"
                value={newGoalAmount}
                onChange={(e) => setNewGoalAmount(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addGoal}
                className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500"
                disabled={!newGoalName.trim() || newGoalAmount <= 0}
              >
                Create Goal
              </Button>
              <Button
                onClick={() => {
                  setShowAddGoal(false)
                  setNewGoalName('')
                  setNewGoalAmount(100)
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DashboardCard>
      )}

      {goals.length === 0 && !showAddGoal && (
        <DashboardCard
          title="🎯 No Goals Yet"
          description="Start saving for something special!"
          className="bg-white/80 backdrop-blur-sm text-center"
        >
          <p className="text-gray-600 py-4">
            Set a savings goal and track your progress. You can save up for toys, games, or anything else you want!
          </p>
        </DashboardCard>
      )}
    </div>
  )
}
