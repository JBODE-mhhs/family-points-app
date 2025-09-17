import { useState } from 'react'
import NavBar from '../components/NavBar'
import { useApp } from '../state/store'
import { formatTime } from '../utils/date'
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates'

export default function Settings(){
  const app = useApp()
  const h = app.household
  useRealtimeUpdates() // This handles all real-time updates
  
  if (!h) return <div className="container"><div className="panel">No household created.</div></div>
  
  const s = h.settings
  
  const [hasChanges, setHasChanges] = useState(false)
  const [tempSettings, setTempSettings] = useState(() => {
    try {
      const initial = {
        ...s,
        timezone: s.timezone || 'America/New_York',
        autoBalanceEnabled: s.autoBalanceEnabled || false
      }
      return initial
    } catch (error) {
      console.error('Error initializing tempSettings:', error)
      return {
        ...s,
        timezone: 'America/New_York',
        autoBalanceEnabled: false
      }
    }
  })

  const update = (patch: Partial<typeof s>) => {
    setTempSettings(prev => ({ ...prev, ...patch }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    app.updateSettings(() => tempSettings)
    setHasChanges(false)
    alert('Settings saved!')
  }

  const resetChildPoints = (childId: string) => {
    if (confirm('Are you sure you want to reset this child\'s points to 0?')) {
      app.addEarn(childId, 'MANUAL_RESET', 'Points reset by parent', -app.ledger.filter(l => l.childId === childId).reduce((a, b) => a + b.points, 0))
      alert('Points reset!')
    }
  }

  const addPoints = (childId: string, points: number) => {
    if (points !== 0) {
      app.addEarn(childId, 'MANUAL_ADJUSTMENT', `Manual adjustment by parent (${points > 0 ? '+' : ''}${points})`, points)
      alert(`Added ${points} points!`)
    }
  }

  const resetTodayTasks = (childId?: string) => {
    const childName = childId ? h.children.find(c => c.id === childId)?.name : 'all children'
    if (confirm(`Are you sure you want to reset all completed tasks for ${childName} today? This will allow them to complete the tasks again.`)) {
      app.resetTodayTasks(childId)
      alert(`Tasks reset for ${childName}!`)
    }
  }

  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ]

  return (
    <div className="container">
      <NavBar/>
      
      <div className="panel">
        <div className="section-header">
          <div>
            <h1>⚙️ Settings</h1>
            <div className="section-subtitle">Configure your family's point system</div>
          </div>
        </div>
        
        <div className="grid grid-3">
          <div>
            <NumberField label="Block minutes" value={tempSettings.blockMinutes} onChange={v=>update({blockMinutes:v})}/>
          </div>
          <div>
            <NumberField label="Points per dollar" value={tempSettings.pointsPerDollar} onChange={v=>update({pointsPerDollar:v})}/>
            <div className="points-calculator">
              <div className="calc-title">Conversion Rate</div>
              <div className="calc-value">{tempSettings.pointsPerDollar}p = $1</div>
              <div className="calc-subtitle">50 points = $1.00</div>
            </div>
          </div>
          <div>
            <NumberField label="Team bonus points" value={tempSettings.teamBonusPoints} onChange={v=>update({teamBonusPoints:v})}/>
          </div>
        </div>
        <div className="grid grid-3">
          <div>
            <NumberField label="School-day cap (minutes)" value={tempSettings.schooldayCapMinutes} onChange={v=>update({schooldayCapMinutes:v})}/>
          </div>
          <div>
            <NumberField label="Weekend cap (minutes)" value={tempSettings.weekendCapMinutes} onChange={v=>update({weekendCapMinutes:v})}/>
          </div>
          <div>
            <NumberField label="No-screen buffer (minutes)" value={tempSettings.noScreenBufferMinutes} onChange={v=>update({noScreenBufferMinutes:v})}/>
          </div>
        </div>
        
        <div className="grid grid-2">
          <div>
            <label className="label">Timezone</label>
            <select className="input" value={tempSettings.timezone} onChange={e=>update({timezone:e.target.value})}>
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="vstack">
            <label className="label">Auto-balance Points</label>
            <div className="hstack">
              <button 
                className={`btn ${tempSettings.autoBalanceEnabled ? 'primary' : 'ghost'}`}
                onClick={() => update({autoBalanceEnabled: !tempSettings.autoBalanceEnabled})}
              >
                {tempSettings.autoBalanceEnabled ? 'Enabled' : 'Disabled'}
              </button>
              <button 
                className="btn warn"
                onClick={() => {
                  app.autoBalancePoints()
                  alert('Points have been auto-balanced!')
                }}
              >
                Run Now
              </button>
            </div>
            <div className="help-text">
              Auto-balance helps keep children's points fair by making small adjustments toward the average.
            </div>
          </div>
        </div>

        <div className="section-header">
          <div>
            <div className="section-title">Save Changes</div>
            <div className="section-subtitle">Save your settings changes</div>
          </div>
          <button 
            className={`btn primary ${!hasChanges ? 'disabled' : ''}`}
            onClick={saveSettings}
            disabled={!hasChanges}
          >
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
        <div className="panel">
          <div className="section-header">
            <div>
              <div className="section-title">👨‍👩‍👧‍👦 Children Management</div>
              <div className="section-subtitle">Manage children's settings and points</div>
            </div>
          </div>
          
          <div className="grid grid-2">
            {h.children.map(c => {
              const currentPoints = app.ledger.filter(l => l.childId === c.id).reduce((a, b) => a + b.points, 0)
              return (
                <div key={c.id} className="card">
                  <div className="section-header">
                    <div>
                      <h3>{c.name}</h3>
                      <div className="section-subtitle">Current points: {currentPoints}</div>
                    </div>
                  </div>
                  
                  <div className="vstack">
                    <NumberField label="Weekly cash cap ($)" value={c.weeklyCashCap} onChange={v=>app.updateChild(c.id, cur => ({...cur, weeklyCashCap: v}))}/>
                    <div className="grid grid-2">
                      <div>
                        <label className="label">School bedtime (HH:MM)</label>
                        <input 
                          className="input" 
                          type="time" 
                          value={c.bedtimes.school} 
                          onChange={v=>app.updateChild(c.id, cur => ({...cur, bedtimes: {...cur.bedtimes, school:v.target.value}}))}
                        />
                        <div className="help-text">Current time: {formatTime(new Date(), tempSettings.timezone)}</div>
                      </div>
                      <div>
                        <label className="label">Weekend bedtime (HH:MM)</label>
                        <input 
                          className="input" 
                          type="time" 
                          value={c.bedtimes.weekend} 
                          onChange={v=>app.updateChild(c.id, cur => ({...cur, bedtimes: {...cur.bedtimes, weekend:v.target.value}}))}
                        />
                        <div className="help-text">Current time: {formatTime(new Date(), tempSettings.timezone)}</div>
                      </div>
                    </div>
                    
                    <div className="vstack">
                      <label className="label">Points Management (Parent Only)</label>
                      <div className="hstack">
                        <button className="btn warn" onClick={() => resetChildPoints(c.id)}>
                          Reset to 0
                        </button>
                        <button className="btn good" onClick={() => addPoints(c.id, 10)}>
                          +10
                        </button>
                        <button className="btn good" onClick={() => addPoints(c.id, 50)}>
                          +50
                        </button>
                        <button className="btn bad" onClick={() => addPoints(c.id, -10)}>
                          -10
                        </button>
                      </div>
                    </div>
                    
                    <div className="vstack">
                      <label className="label">Task Management (Parent Only)</label>
                      <div className="hstack">
                        <button className="btn warn" onClick={() => resetTodayTasks(c.id)}>
                          Reset Today's Tasks
                        </button>
                      </div>
                      <div className="small" style={{color: 'var(--sub)'}}>
                        Clears all completed tasks for today, allowing child to complete them again
                      </div>
                    </div>
                    
                    <div className="vstack">
                      <label className="label">Current Time ({tempSettings.timezone})</label>
                      <div className="time-display">
                        {formatTime(new Date(), tempSettings.timezone)}
                      </div>
                    </div>
                    
                    <div className="vstack">
                      <label className="label">Child Portal Access</label>
                      <div className="hstack">
                        <button 
                          className="btn primary" 
                          onClick={() => {
                            const inviteCode = app.generateInviteCode(c.id)
                            navigator.clipboard.writeText(`${window.location.origin}/child/${c.id}?invite=${inviteCode}`)
                            alert(`Invite link copied! Share this with ${c.name} to give them access to their portal.`)
                          }}
                        >
                          Generate Invite Link
                        </button>
                        <button 
                          className="btn" 
                          onClick={() => {
                            window.open(`/child/${c.id}`, '_blank')
                          }}
                        >
                          Open Child Portal
                        </button>
                      </div>
                      <div className="help-text">
                        Generate an invite link to share with {c.name} so they can access their own portal.
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="panel vstack">
        <h3>Baselines</h3>
        
        <div className="panel" style={{backgroundColor: 'var(--warn-bg)', border: '1px solid var(--warn)', marginBottom: '16px'}}>
          <div className="section-header">
            <div>
              <div className="section-title">🔄 Global Reset (Parent Only)</div>
              <div className="section-subtitle">Reset tasks for all children at once</div>
            </div>
          </div>
          
          <div className="vstack">
            <button className="btn warn" onClick={() => resetTodayTasks()}>
              Reset All Tasks for Today
            </button>
            <div className="small" style={{color: 'var(--sub)'}}>
              Clears all completed tasks for all children today, allowing them to complete tasks again
            </div>
          </div>
        </div>
        
        <TaskEditor list={s.baselineTasks} onChange={(list)=>update({baselineTasks:list})}/>
        <h3>Extras</h3>
        <TaskEditor list={s.extraTasks} onChange={(list)=>update({extraTasks:list})}/>
      </div>
    </div>
  )
}

function NumberField({label, value, onChange}:{label:string; value:number; onChange:(v:number)=>void}){
  return (
    <div className="vstack">
      <label className="label">{label}</label>
      <input className="input" type="number" value={value} onChange={e=>onChange(parseInt(e.target.value||'0', 10))}/>
    </div>
  )
}
function TextField({label, value, onChange}:{label:string; value:string; onChange:(v:string)=>void}){
  return (
    <div className="vstack">
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={e=>onChange(e.target.value)}/>
    </div>
  )
}

import { TaskDef, TaskCategory } from '../types'
import { v4 as uuid } from 'uuid'

function TaskEditor({ list, onChange }:{ list: TaskDef[]; onChange:(l:TaskDef[])=>void }){
  const [newTask, setNewTask] = useState({ label: '', points: 5, category: 'extra' as TaskCategory })
  
  const update = (id:string, patch: Partial<TaskDef>) => onChange(list.map(t => t.id===id? {...t, ...patch } : t))
  
  const add = () => {
    if (!newTask.label.trim()) return
    const code = newTask.label.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    onChange(list.concat([{ 
      id: uuid(), 
      code: code, 
      label: newTask.label, 
      points: newTask.points, 
      category: newTask.category 
    }]))
    setNewTask({ label: '', points: 5, category: 'extra' })
  }
  
  const remove = (id:string) => onChange(list.filter(t=>t.id!==id))
  
  return (
    <div className="vstack">
      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Add New Task</div>
            <div className="section-subtitle">Create a new task for your family</div>
          </div>
        </div>
        
        <div className="grid grid-3">
          <div>
            <label className="label">Task Name</label>
            <input 
              className="input" 
              value={newTask.label} 
              onChange={e=>setNewTask({...newTask, label: e.target.value})}
              placeholder="e.g., Take out trash"
            />
          </div>
          <div>
            <label className="label">Points</label>
            <input 
              type="number" 
              className="input" 
              value={newTask.points} 
              onChange={e=>setNewTask({...newTask, points: parseInt(e.target.value||'0',10)})}
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select 
              className="input" 
              value={newTask.category} 
              onChange={e=>setNewTask({...newTask, category: e.target.value as TaskCategory})}
            >
              <option value="baseline">Daily Task</option>
              <option value="extra">Extra Task</option>
            </select>
          </div>
        </div>
        
        <div className="hstack">
          <button className="btn primary" onClick={add} disabled={!newTask.label.trim()}>
            Add Task
          </button>
        </div>
      </div>
      
      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Current Tasks</div>
            <div className="section-subtitle">Manage existing tasks</div>
          </div>
        </div>
        
        <div className="vstack">
          {list.map(t => (
            <div key={t.id} className="card">
              <div className="grid grid-3">
                <div>
                  <label className="label">Task Name</label>
                  <input 
                    className="input" 
                    value={t.label} 
                    onChange={e=>update(t.id, {label:e.target.value})}
                  />
                </div>
                <div>
                  <label className="label">Points</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={t.points} 
                    onChange={e=>update(t.id, {points:parseInt(e.target.value||'0',10)})}
                    min="1"
                    max="100"
                  />
                </div>
                <div className="vstack">
                  <label className="label">Actions</label>
                  <button className="btn bad" onClick={()=>remove(t.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="help-text">No tasks created yet. Add one above!</div>
          )}
        </div>
      </div>

    </div>
  )
}
