import { Link } from 'react-router-dom'
import { useApp } from '../state/store'
import { todayYMD, toYMD, formatTime } from '../utils/date'
import { calcBalancePoints, getCutoffMinutes, getDailyCapMinutes, spentScreenMinutesOnDate, spentScreenMinutesFromSessions, spentScreenMinutesFromLedger, teamBonusGiven, baselineDone } from '../utils/logic'
import TaskButtons from '../components/TaskButtons'
import Timer from '../components/Timer'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'
import { useMemo, useState } from 'react'

export default function ParentDashboard(){
  const app = useApp()
  const household = app.household
  const ledger = app.ledger
  const ymd = todayYMD()
  useRealtimeUpdates() // This handles all real-time updates
  
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
  
  if (!household) return <div className="p-6"><div className="bg-white rounded-xl p-6 shadow-soft">No household. <Link to="/">Go to Setup</Link></div></div>
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
    console.log('📋 Available labels:', labels)
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Family Dashboard</h1>
            <div className="text-gray-500">Manage your family's points and activities</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <div className="text-lg font-semibold text-gray-900">Pending Requests</div>
              <div className="text-gray-500">Children's requests waiting for approval</div>
            </div>
          </div>
        
        <div className="space-y-4">
          {ledger.filter(l => l.date === ymd && l.type === 'earn' && l.code.startsWith('REQUEST_')).map(e => {
            const child = household.children.find(c => c.id === e.childId)!
            return (
              <div key={e.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{child.name} - {e.label}</div>
                    <div className="text-sm text-gray-500">Requested at {new Date(e.ts).toLocaleTimeString()}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors" onClick={() => {
                      // Convert request to actual task completion
                      const taskCode = e.code.replace('REQUEST_', '')
                      // Find the task in settings to get the correct points
                      const task = [...settings.baselineTasks, ...settings.extraTasks].find(t => t.code === taskCode)
                      const points = task?.points || 10
                      app.addEarn(child.id, taskCode, e.label.replace('Request: ', ''), points, true)
                      app.removeLedger(e.id)
                    }}>
                      ✓ Approve
                    </button>
                    <button className="btn warn" onClick={() => app.removeLedger(e.id)}>
                      ✗ Deny
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {ledger.filter(l => l.date === ymd && l.type === 'earn' && l.code.startsWith('SCREEN_REQUEST')).map(e => {
            const child = household.children.find(c => c.id === e.childId)!
            const minutes = parseInt(e.label.match(/(\d+)m/)?.[1] || '0')
            const cost = minutes * settings.pointPerMinute
            return (
              <div key={e.id} className="card">
                <div className="row">
                  <div>
                    <div className="section-title">{child.name} - Screen Time Request</div>
                    <div className="section-subtitle">{e.label} - Cost: {cost} points</div>
                  </div>
                  <div className="hstack">
                    <button className="btn good" onClick={() => {
                      app.addSpend(child.id, 'SCREEN_APPROVED', `Approved: ${e.label}`, cost)
                      app.startScreenTime(child.id, minutes)
                      app.removeLedger(e.id)
                    }}>
                      ✓ Approve
                    </button>
                    <button className="btn warn" onClick={() => app.removeLedger(e.id)}>
                      ✗ Deny
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {ledger.filter(l => l.date === ymd && l.type === 'earn' && l.code === 'PAUSE_REQUEST').map(e => {
            const child = household.children.find(c => c.id === e.childId)!
            return (
              <div key={e.id} className="card">
                <div className="row">
                  <div>
                    <div className="section-title">{child.name} - Pause Request</div>
                    <div className="section-subtitle">Wants to pause their screen time</div>
                  </div>
                  <div className="hstack">
                    <button className="btn good" onClick={() => {
                      // Pause the screen time session
                      app.pauseScreenTime(child.id)
                      app.removeLedger(e.id)
                      alert('Screen time paused for ' + child.name)
                    }}>
                      ✓ Pause
                    </button>
                    <button className="btn warn" onClick={() => app.removeLedger(e.id)}>
                      ✗ Deny
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {ledger.filter(l => l.date === ymd && l.type === 'earn' && (l.code.startsWith('REQUEST_') || l.code.startsWith('SCREEN_REQUEST') || l.code === 'PAUSE_REQUEST')).length === 0 && (
            <div className="help-text">No pending requests</div>
          )}
        </div>
        </div>

        {/* Cash-Out Requests */}
        {app.cashOutRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="panel">
            <div className="section-header">
              <div>
                <div className="section-title">💰 Cash-Out Requests</div>
                <div className="section-subtitle">Children's cash-out requests waiting for approval</div>
              </div>
            </div>
            
            <div className="vstack">
              {app.cashOutRequests.filter(r => r.status === 'pending').map(request => (
                <div key={request.id} className="card">
                  <div className="row">
                    <div>
                      <div className="section-title">{request.childName} - ${request.amount} Cash-Out</div>
                      <div className="section-subtitle">
                        {request.points} points • Requested {new Date(request.requestedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="hstack">
                      <button className="btn good" onClick={() => {
                        if (confirm(`Approve $${request.amount} cash-out for ${request.childName}? This will deduct ${request.points} points.`)) {
                          app.approveCashOut(request.id, true)
                          alert(`Approved $${request.amount} cash-out for ${request.childName}`)
                        }
                      }}>
                        ✓ Approve
                      </button>
                      <button className="btn warn" onClick={() => {
                        if (confirm(`Reject $${request.amount} cash-out request from ${request.childName}?`)) {
                          app.approveCashOut(request.id, false)
                          alert(`Rejected cash-out request from ${request.childName}`)
                        }
                      }}>
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="panel">
          <div className="section-header">
            <div>
              <div className="section-title">Screen Time Sessions</div>
              <div className="section-subtitle">Monitor and control children's screen time</div>
            </div>
          </div>
        
        <div className="vstack">
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
              <div key={session.childId} className="card">
                <div className="row">
                  <div>
                    <div className="section-title">{child.name} - Screen Time</div>
                    <div className="section-subtitle">
                      {session.status === 'running' && `Running - ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} left`}
                      {session.status === 'paused' && `Paused - ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} left`}
                      {session.status === 'completed' && 'Completed'}
                    </div>
                  </div>
                  <div className="hstack">
                    {session.status === 'running' && (
                      <button className="btn warn" onClick={() => app.pauseScreenTime(child.id)}>
                        ⏸️ Pause
                      </button>
                    )}
                    {session.status === 'paused' && (
                      <button className="btn good" onClick={() => app.resumeScreenTime(child.id)}>
                        ▶️ Resume
                      </button>
                    )}
                    <button className="btn bad" onClick={() => {
                      if (confirm(`End screen time for ${child.name}? Remaining time will be refunded as points.`)) {
                        app.endScreenTime(child.id, true)
                      }
                    }}>
                      ⏹️ End
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {Object.keys(app.screenTimeSessions).length === 0 && (
            <div className="help-text">No active screen time sessions</div>
          )}
        </div>
        </div>
      </div>

      <div className="grid grid-2">
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
            <div key={child.id} className="panel">
              <div className="section-header">
                <div>
                  <h2>{child.name}</h2>
                  <div className="section-subtitle">Age {child.age} • Level {child.level}</div>
                </div>
                <Link className="btn primary" to={`/child/${child.id}`}>Child View</Link>
              </div>
              
              <div className="grid grid-3">
                <div className="stat-card">
                  <div className="stat-label">Points Balance</div>
                  <div className="stat-value">{balance}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Screen Time Today</div>
                  <div className="stat-value">{spentToday}m</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Cut-off Time</div>
                  <div className="stat-value">{cutoffStr}</div>
                </div>
              </div>

              <TaskButtons child={child} date={new Date()}/>

              <div className="section">
                <div className="section-header">
                  <div>
                    <div className="section-title">Quick Actions</div>
                    <div className="section-subtitle">Deductions and corrections</div>
                  </div>
                </div>
                
                <div className="help-text">
                  💡 <strong>Accountability System:</strong> When children mark tasks as complete, you can verify them. 
                  If a task wasn't actually done, it will reduce their points by 30% as a penalty.
                </div>
                
                <div className="grid grid-3">
                  <button className="btn warn" onClick={() => app.addDeduction(child.id, 'DED_REMINDER', 'Second reminder', 5)}>–5 Reminder</button>
                  <button className="btn warn" onClick={() => app.addDeduction(child.id, 'DED_RUDE', 'Rude language', 10)}>–10 Rude</button>
                  <button className="btn warn" onClick={() => app.addDeduction(child.id, 'DED_TIMER_IGNORED', 'Timer ignored', 10)}>–10 Timer Ignored</button>
                </div>
                <div className="grid grid-3">
                  <button className="btn bad" onClick={() => app.addLockout(child.id, 'LYING_SNEAK', 30)}>Lockout (Lying/Sneak –30)</button>
                  <button className="btn bad" onClick={() => app.addLockout(child.id, 'UNSAFE', 20)}>Lockout (Unsafe –20)</button>
                  <button className="btn good" onClick={() => app.addReset(child.id)}>Reset Complete</button>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <div>
                    <div className="section-title">Screen Time</div>
                    <div className="section-subtitle">Manage screen time blocks</div>
                  </div>
                </div>
                
                <Timer child={child} onSpend={() => {
                  app.addSpend(child.id, 'SCREEN_BLOCK', '30-min internet block', settings.blockMinutes * settings.pointPerMinute)
                }}/>

                <div className="hstack">
                  <button className="btn" onClick={() => app.addSpend(child.id, 'SCREEN_BLOCK', '30-min internet block', settings.blockMinutes * settings.pointPerMinute)}>Spend 30m</button>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <div>
                    <div className="section-title">Cash-out Preview</div>
                    <div className="section-subtitle">Available for bank day</div>
                  </div>
                </div>
                <CashPreview childId={child.id} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="panel">
        <div className="section-header">
          <div>
            <div className="section-title">Team Bonus</div>
            <div className="section-subtitle">Reward both children when all baselines are complete</div>
          </div>
          <button className="btn primary" disabled={teamBonusGiven(ledger, ymd)} onClick={giveTeamBonus}>
            Give +{settings.teamBonusPoints} to both
          </button>
        </div>
      </div>


      <div className="panel">
        <div className="section-header">
          <div>
            <div className="section-title">All Activity</div>
            <div className="section-subtitle">All points earned and spent</div>
          </div>
        </div>
        
        <div className="ledger-container">
          <>
            {/* Filter Controls */}
            <div className="panel" style={{marginBottom: '16px', padding: '16px'}}>
              <div className="section-header" style={{marginBottom: filtersExpanded ? '16px' : '0'}}>
                <div>
                  <div className="section-title">Filter Activity</div>
                  <div className="section-subtitle">Filter by any column to find specific entries</div>
                </div>
                <div className="hstack" style={{gap: '8px'}}>
                  <button className="btn ghost" onClick={clearFilters}>Clear All</button>
                  <button 
                    className="btn ghost" 
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    style={{padding: '8px'}}
                  >
                    {filtersExpanded ? '▼' : '▶'} {filtersExpanded ? 'Hide' : 'Show'} Filters
                  </button>
                </div>
              </div>
              
              {filtersExpanded && (
                <div className="grid grid-3" style={{gap: '12px'}}>
                  <div>
                    <label className="label">Start Date</label>
                    <input 
                      type="date" 
                      className="input" 
                      value={filters.startDate}
                      onChange={(e) => updateFilter('startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input 
                      type="date" 
                      className="input" 
                      value={filters.endDate}
                      onChange={(e) => updateFilter('endDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Child</label>
                    <select 
                      className="input" 
                      value={filters.child}
                      onChange={(e) => updateFilter('child', e.target.value)}
                    >
                      <option value="">All Children</option>
                      {household.children.map(child => (
                        <option key={child.id} value={child.name}>{child.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select 
                      className="input" 
                      value={filters.type}
                      onChange={(e) => updateFilter('type', e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="earn">Earn</option>
                      <option value="spend">Spend</option>
                      <option value="deduction">Deduction</option>
                      <option value="bonus">Bonus</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Labels</label>
                    <select 
                      className="input" 
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !filters.labels.includes(e.target.value)) {
                          const newLabels = [...filters.labels, e.target.value]
                          console.log('🎯 Adding label:', e.target.value, 'New labels array:', newLabels)
                          setFilters(prev => ({ ...prev, labels: newLabels }))
                        }
                        e.target.value = "" // Reset selection
                      }}
                    >
                      <option value="" disabled>
                        {filters.labels.length === 0 ? 'All Labels' : `${filters.labels.length} selected`}
                      </option>
                      {getAllLabels().map(label => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                    {filters.labels.length > 0 && (
                      <div className="hstack" style={{gap: '4px', marginTop: '4px', flexWrap: 'wrap'}}>
                        {filters.labels.map(label => (
                          <span key={label} className="badge" style={{fontSize: '12px', padding: '2px 6px'}}>
                            {label}
                            <button 
                              onClick={() => setFilters(prev => ({ ...prev, labels: prev.labels.filter(l => l !== label) }))}
                              style={{marginLeft: '4px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer'}}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label">Points</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g., +10, -5, 50"
                      value={filters.points}
                      onChange={(e) => updateFilter('points', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Balance</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g., 100, >50, <0"
                      value={filters.balance}
                      onChange={(e) => updateFilter('balance', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Child</th>
                <th>Type</th>
                <th>Label</th>
                <th>Points</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ledger.filter(l => {
                // Don't show system-generated entries that don't need verification
                const systemCodes = ['SCREEN_REFUND', 'SCREEN_TIME_USED', 'AUTO_BALANCE', 'TEAM_BONUS']
                if (systemCodes.includes(l.code)) return false
                
                return true
              }).slice().sort((a,b)=>b.ts-a.ts).filter(e => {
                const child = household.children.find(c => c.id === e.childId)
                if (!child) return false
                
                // Apply date range filters
                if (filters.startDate || filters.endDate) {
                  const entryDate = new Date(e.ts).toISOString().split('T')[0] // Get YYYY-MM-DD format
                  if (filters.startDate && entryDate < filters.startDate) return false
                  if (filters.endDate && entryDate > filters.endDate) return false
                }
                if (filters.child && child.name !== filters.child) return false
                if (filters.type && e.type !== filters.type) return false
                if (filters.labels.length > 0) {
                  console.log('🔍 Checking entry:', e.label, 'Selected labels:', filters.labels, 'Match:', filters.labels.includes(e.label))
                  if (!filters.labels.includes(e.label)) {
                    console.log('❌ Filtering OUT:', e.label)
                    return false
                  } else {
                    console.log('✅ Keeping:', e.label)
                  }
                }
                if (filters.points) {
                  const pointsStr = e.points >= 0 ? `+${e.points}` : `${e.points}`
                  if (!pointsStr.includes(filters.points)) return false
                }
                
                return true
              }).filter(e => {
                // Pre-calculate balance for filtering
                const child = household.children.find(c => c.id === e.childId)
                if (!child) return false
                
                // Calculate running balance for this child up to this point
                const allEntries = ledger.filter(l => !['SCREEN_REFUND', 'SCREEN_TIME_USED', 'AUTO_BALANCE', 'TEAM_BONUS'].includes(l.code))
                    .sort((a,b) => b.ts - a.ts)
                const childEntries = allEntries.filter(entry => entry.childId === e.childId)
                const currentEntryIndex = childEntries.findIndex(entry => entry.id === e.id)
                const entriesUpToThis = childEntries.slice(currentEntryIndex)
                const runningBalance = entriesUpToThis.reduce((sum, entry) => sum + entry.points, 0)
                
                // Apply balance filter
                if (filters.balance) {
                  const balanceStr = runningBalance.toString()
                  console.log('💰 Checking balance:', runningBalance, 'Filter:', filters.balance, 'Match:', balanceStr === filters.balance)
                  if (balanceStr !== filters.balance) {
                    console.log('❌ Filtering OUT by balance:', e.label, 'Balance:', runningBalance)
                    return false
                  } else {
                    console.log('✅ Keeping by balance:', e.label, 'Balance:', runningBalance)
                  }
                }
                
                return true
              }).map((e, index, array) => {
                const child = household.children.find(c => c.id === e.childId)!
                
                // Calculate running balance for this child up to this point
                const childEntries = array.filter(entry => entry.childId === e.childId)
                const currentEntryIndex = childEntries.findIndex(entry => entry.id === e.id)
                const entriesUpToThis = childEntries.slice(currentEntryIndex)
                const runningBalance = entriesUpToThis.reduce((sum, entry) => sum + entry.points, 0)
                
                
                const getStatusBadge = () => {
                  if (e.type === 'earn' && e.verified === true) return <span className="badge" style={{background: 'var(--good)'}}>✓ Verified</span>
                  if (e.type === 'earn' && e.verified === false) return <span className="badge" style={{background: 'var(--bad)'}}>✗ Incomplete</span>
                  if (e.type === 'earn' && e.verified === undefined) return <span className="badge" style={{background: 'var(--warn)'}}>⏳ Pending</span>
                  return <span className="badge">{e.type}</span>
                }
                return (
                  <tr key={e.id}>
                    <td>{new Date(e.ts).toLocaleString()}</td>
                    <td>{child?.name}</td>
                    <td>{e.type}</td>
                    <td>{e.label}</td>
                    <td style={{color: e.points>=0? 'var(--good)':'var(--bad)', fontWeight: '600'}}>{e.points>=0? '+' : ''}{e.points}</td>
                    <td style={{fontWeight: '600', color: runningBalance >= 0 ? 'var(--good)' : 'var(--bad)'}}>{runningBalance}</td>
                    <td>
                      <div className="hstack">
                        {e.type === 'earn' && e.verified === undefined && !['SCREEN_REFUND', 'SCREEN_TIME_USED', 'AUTO_BALANCE', 'TEAM_BONUS'].includes(e.code) && (
                          <>
                            <button className="btn good small" onClick={() => app.verifyTask(e.id)}>✓</button>
                            <button className="btn warn small" onClick={() => app.markTaskIncomplete(e.id)}>✗</button>
                          </>
                        )}
                        {e.type === 'earn' && e.verified === true && !['SCREEN_REFUND', 'SCREEN_TIME_USED', 'AUTO_BALANCE', 'TEAM_BONUS'].includes(e.code) && (
                          <button className="btn warn small" onClick={() => {
                            if (confirm(`Undo this completed task? This will remove ${e.points} points from ${child?.name}.`)) {
                              app.removeLedger(e.id)
                            }
                          }}>Undo Task</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </>
        </div>
      </div>
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
    <div className="card">
      <div className="grid grid-2">
        <div className="vstack">
          <div className="stat-label">Current Balance</div>
          <div className="stat-value">{balance}</div>
          <div className="small">points</div>
        </div>
        <div className="vstack">
          <div className="stat-label">Available Cash</div>
          <div className="stat-value" style={{color: 'var(--good)'}}>${preview}</div>
          <div className="small">this week</div>
        </div>
      </div>
      <div className="row" style={{marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)'}}>
        <div className="small">Rate: <span className="tag">50 pts = $1</span></div>
        <div className="small">Weekly cap: <strong>${cap}</strong></div>
      </div>
      <div className="small" style={{marginTop: '8px', color: 'var(--sub)'}}>
        Use the Bank Day screen on Sundays to confirm cash-outs.
      </div>
    </div>
  )
}
