import { Link, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useApp } from '../state/store'
import { todayYMD, formatTime } from '../utils/date'
import { calcBalancePoints, getDailyCapMinutes, spentScreenMinutesOnDate, spentScreenMinutesFromSessions, spentScreenMinutesFromLedger } from '../utils/logic'
import ChildTaskDisplay from '../components/ChildTaskDisplay'
import ScreenTimeTimer from '../components/ScreenTimeTimer'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { useState } from 'react'

export default function ChildDashboard(){
  const { childId } = useParams()
  const app = useApp()
  const household = app.household
  const [activeTab, setActiveTab] = useState<'tasks' | 'bank'>('tasks')
  useRealtimeUpdates() // This handles all real-time updates
  
  if (!household) return <div className="container"><div className="panel">No household. <Link to="/">Go to Setup</Link></div></div>
  const child = household.children.find(c => c.id === childId)
  if (!child) return <div className="container"><div className="panel">Child not found.</div></div>
  const ymd = todayYMD()
  const balance = calcBalancePoints(app.ledger, child.id)
  const spentFromSessions = spentScreenMinutesFromSessions(app.screenTimeSessions, child.id, ymd)
  const spentFromLedger = spentScreenMinutesFromLedger(app.ledger, child.id, ymd)
  const spentToday = spentFromSessions + spentFromLedger
  const cap = getDailyCapMinutes(child, new Date(), household.settings)
  
  // Check for active screen time sessions
  const activeScreenTime = app.screenTimeSessions[child.id]

  return (
    <div className="container kid-theme">
      <NavBar/>
      
      <div className="panel">
        <div className="section-header">
          <div>
            <h1>🌟 {child.name}'s Dashboard</h1>
            <div className="section-subtitle">Track your points and complete your tasks</div>
          </div>
        </div>
        
        <div className="grid grid-2">
          <div className="stat-card">
            <div className="stat-label">Points Balance</div>
            <div className="stat-value">{balance}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Screen Time Today</div>
            <div className="stat-value">{spentToday}m</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="panel">
        <div className="tab-navigation" style={{gap: '4px', marginBottom: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px'}}>
          <button 
            className={`btn ${activeTab === 'tasks' ? 'primary' : 'ghost'}`}
            onClick={() => setActiveTab('tasks')}
            style={{whiteSpace: 'nowrap', flexShrink: 0, padding: '12px 16px', fontSize: '14px'}}
          >
            📋 Tasks & Screen Time
          </button>
          <button 
            className={`btn ${activeTab === 'bank' ? 'primary' : 'ghost'}`}
            onClick={() => setActiveTab('bank')}
            style={{whiteSpace: 'nowrap', flexShrink: 0, padding: '12px 16px', fontSize: '14px'}}
          >
            🏦 Bank
          </button>
        </div>

        {activeTab === 'tasks' && (
          <>
            <ChildTaskDisplay child={child} date={new Date()}/>

            {activeScreenTime && (
              <div className="panel">
                <div className="section-header">
                  <div>
                    <div className="section-title">⏰ Active Screen Time</div>
                    <div className="section-subtitle">Your approved screen time session</div>
                  </div>
                </div>
                
                <ScreenTimeTimer 
                  childId={child.id}
                  minutes={activeScreenTime.totalMinutes}
                  onComplete={() => {
                    // Screen time completed
                    app.endScreenTime(child.id)
                  }}
                />
              </div>
            )}

            <div className="panel">
              <div className="section-header">
                <div>
                  <div className="section-title">🎮 Screen Time</div>
                  <div className="section-subtitle">Request screen time based on your points</div>
                </div>
              </div>
              
              <div className="vstack">
                <div className="help-text">
                  You have {balance} points available. Each minute costs {household.settings.pointPerMinute} point{household.settings.pointPerMinute !== 1 ? 's' : ''}.
                </div>
                
                <div className="grid grid-2" style={{gap: '12px'}}>
                  <button className="btn" onClick={() => {
                    const minutes = 15
                    const cost = minutes * household.settings.pointPerMinute
                    if (balance >= cost) {
                      app.addEarn(child.id, 'SCREEN_REQUEST', `Screen time request: ${minutes}m`, 0)
                      alert('Screen time request sent to parent!')
                    } else {
                      alert(`Not enough points! You need ${cost} points but only have ${balance}.`)
                    }
                  }}>
                    ⏰ 15 min<br/><small>(15 pts)</small>
                  </button>
                  <button className="btn" onClick={() => {
                    const minutes = 30
                    const cost = minutes * household.settings.pointPerMinute
                    if (balance >= cost) {
                      app.addEarn(child.id, 'SCREEN_REQUEST', `Screen time request: ${minutes}m`, 0)
                      alert('Screen time request sent to parent!')
                    } else {
                      alert(`Not enough points! You need ${cost} points but only have ${balance}.`)
                    }
                  }}>
                    ⏰ 30 min<br/><small>(30 pts)</small>
                  </button>
                  <button className="btn" onClick={() => {
                    const minutes = 60
                    const cost = minutes * household.settings.pointPerMinute
                    if (balance >= cost) {
                      app.addEarn(child.id, 'SCREEN_REQUEST', `Screen time request: ${minutes}m`, 0)
                      alert('Screen time request sent to parent!')
                    } else {
                      alert(`Not enough points! You need ${cost} points but only have ${balance}.`)
                    }
                  }}>
                    ⏰ 60 min<br/><small>(60 pts)</small>
                  </button>
                  <button className="btn" onClick={() => {
                    const minutes = 90
                    const cost = minutes * household.settings.pointPerMinute
                    if (balance >= cost) {
                      app.addEarn(child.id, 'SCREEN_REQUEST', `Screen time request: ${minutes}m`, 0)
                      alert('Screen time request sent to parent!')
                    } else {
                      alert(`Not enough points! You need ${cost} points but only have ${balance}.`)
                    }
                  }}>
                    ⏰ 90 min<br/><small>(90 pts)</small>
                  </button>
                  <button className="btn" onClick={() => {
                    const minutes = 120
                    const cost = minutes * household.settings.pointPerMinute
                    if (balance >= cost) {
                      app.addEarn(child.id, 'SCREEN_REQUEST', `Screen time request: ${minutes}m`, 0)
                      alert('Screen time request sent to parent!')
                    } else {
                      alert(`Not enough points! You need ${cost} points but only have ${balance}.`)
                    }
                  }}>
                    ⏰ 120 min<br/><small>(120 pts)</small>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'bank' && (
          <BankTab childId={child.id} balance={balance} />
        )}
      </div>
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
    <div className="vstack" style={{gap: '16px'}}>
      <div className="panel">
        <div className="section-header">
          <div>
            <div className="section-title">💰 Request Cash-Out</div>
            <div className="section-subtitle">Convert your points to real money!</div>
          </div>
        </div>
        
        <div className="vstack">
          <div className="help-text">
            You have {balance} points available. {pointsPerDollar} points = $1.00
            {child.weeklyCashCap > 0 && ` (Weekly limit: $${child.weeklyCashCap})`}
          </div>
          
          <div className="vstack" style={{gap: '16px'}}>
            <div>
              <label className="label">Amount to request ($)</label>
              <input 
                type="number" 
                className="input" 
                min="1" 
                max={maxDollars}
                value={requestAmount}
                onChange={(e) => setRequestAmount(Math.min(maxDollars, Math.max(1, parseInt(e.target.value || '1', 10))))}
                style={{fontSize: '18px', textAlign: 'center', fontWeight: 'bold'}}
              />
            </div>
            <div style={{textAlign: 'center', padding: '16px', background: 'var(--muted)', borderRadius: '12px'}}>
              <div className="label">Points cost</div>
              <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)'}}>
                {requestAmount * pointsPerDollar} points
              </div>
            </div>
          </div>
          
          <button 
            className="btn primary" 
            disabled={requestAmount <= 0 || requestAmount > maxDollars}
            onClick={() => {
              app.requestCashOut(childId, requestAmount)
              alert(`Cash-out request for $${requestAmount} sent to parent!`)
            }}
          >
            Request ${requestAmount} Cash-Out
          </button>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="panel">
          <div className="section-header">
            <div>
              <div className="section-title">⏳ Pending Requests</div>
              <div className="section-subtitle">Waiting for parent approval</div>
            </div>
          </div>
          
          <div className="vstack">
            {pendingRequests.map(request => (
              <div key={request.id} className="card" style={{background: 'var(--warn-bg)', border: '1px solid var(--warn)'}}>
                <div className="hstack" style={{justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div style={{fontWeight: '600'}}>${request.amount} (${request.points} points)</div>
                    <div className="small" style={{color: 'var(--text-2)'}}>
                      Requested {new Date(request.requestedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="badge" style={{background: 'var(--warn)'}}>
                    Pending
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentRequests.length > 0 && (
        <div className="panel">
          <div className="section-header">
            <div>
              <div className="section-title">📋 Recent Requests</div>
              <div className="section-subtitle">Your cash-out history</div>
            </div>
          </div>
          
          <div className="vstack">
            {recentRequests.map(request => (
              <div key={request.id} className="card">
                <div className="hstack" style={{justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div style={{fontWeight: '600'}}>${request.amount} (${request.points} points)</div>
                    <div className="small" style={{color: 'var(--text-2)'}}>
                      {new Date(request.requestedAt).toLocaleString()}
                      {request.processedAt && ` • Processed ${new Date(request.processedAt).toLocaleString()}`}
                    </div>
                  </div>
                  <div className={`badge ${
                    request.status === 'approved' ? 'good' : 
                    request.status === 'rejected' ? 'bad' : 'warn'
                  }`}>
                    {request.status === 'approved' ? '✓ Approved' :
                     request.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
