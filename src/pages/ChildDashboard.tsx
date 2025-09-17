import { Link, useParams } from 'react-router-dom'
import { useApp } from '../state/store'
import { todayYMD, formatTime } from '../utils/date'
import { calcBalancePoints, getDailyCapMinutes, spentScreenMinutesFromSessions, spentScreenMinutesFromLedger } from '../utils/logic'
import ChildTaskDisplay from '../components/ChildTaskDisplay'
import ScreenTimeTimer from '../components/ScreenTimeTimer'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { useState } from 'react'
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
  Sparkles
} from 'lucide-react'

export default function ChildDashboard(){
  const { childId } = useParams()
  const app = useApp()
  const household = app.household
  const [activeTab, setActiveTab] = useState<'tasks' | 'bank'>('tasks')
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  You have <strong>{balance}</strong> points available. Each minute costs <strong>{household.settings.pointPerMinute}</strong> point{household.settings.pointPerMinute !== 1 ? 's' : ''}.
                </p>
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
                          alert('Screen time request sent to parent!')
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
              alert(`Cash-out request for $${requestAmount} sent to parent!`)
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
                      <div className="font-semibold text-gray-900">${request.amount} (${request.points} points)</div>
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
                      <div className="font-semibold text-gray-900">${request.amount} (${request.points} points)</div>
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
