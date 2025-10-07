import { useState } from 'react'
import { useApp } from '../state/store'
import { Child, TaskDef } from '../types'
import { toYMD } from '../utils/date'

interface ChildTaskRequestProps {
  child: Child
  date: Date
}

export default function ChildTaskRequest({ child, date }: ChildTaskRequestProps) {
  const app = useApp()
  const ymd = toYMD(date)
  const s = app.household!.settings
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [requestMessage, setRequestMessage] = useState('')

  const base = s.baselineTasks
  const extra = s.extraTasks.filter(t => !t.ageMin || child.age >= t.ageMin)

  const done = (code: string) => {
    return app.ledger.some(l => 
      l.childId === child.id && 
      l.date === ymd && 
      l.code === code && 
      l.type === 'earn'
    )
  }

  const requestTaskCompletion = () => {
    if (!selectedTask) return
    
    const task = [...base, ...extra].find(t => t.code === selectedTask)
    if (!task) return

    // Add a request entry to the ledger
    app.addEarn(child.id, `REQUEST_${task.code}`, `Request: ${task.label}`, 0)
    setSelectedTask('')
    setRequestMessage('')
    // Request sent - dialog will close automatically
  }

  const requestScreenTime = (minutes: number) => {
    const cost = minutes * s.pointPerMinute
    const balance = app.ledger.filter(l => l.childId === child.id).reduce((a, b) => a + b.points, 0)
    
    if (balance < cost) {
      alert(`Not enough points! You need ${cost} points but only have ${balance}.`)
      return
    }

    if (confirm(`Request ${minutes} minutes of screen time for ${cost} points?`)) {
      app.addEarn(child.id, 'SCREEN_REQUEST', `Screen time request: ${minutes}m`, 0)
      // Request sent - no need for alert
    }
  }

  return (
    <div className="vstack">
      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Request Task Completion</div>
            <div className="section-subtitle">Ask parent to verify you completed a task</div>
          </div>
        </div>
        
        <div className="vstack">
          <div>
            <label className="label">Select completed task:</label>
            <select 
              className="input" 
              value={selectedTask} 
              onChange={(e) => setSelectedTask(e.target.value)}
            >
              <option value="">Choose a task...</option>
              {[...base, ...extra].filter(t => !done(t.code)).map(t => (
                <option key={t.code} value={t.code}>
                  {t.label} (+{t.points} points)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Message to parent (optional):</label>
            <textarea 
              className="input" 
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Tell parent how you completed the task..."
              rows={3}
            />
          </div>
          
          <button 
            className="btn primary" 
            onClick={requestTaskCompletion}
            disabled={!selectedTask}
          >
            Send Request to Parent
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Request Screen Time</div>
            <div className="section-subtitle">Ask parent for screen time based on your points</div>
          </div>
        </div>

        <div className="vstack">
          {/* Show pending screen time requests */}
          {app.ledger.filter(l =>
            l.childId === child.id &&
            l.date === ymd &&
            l.code === 'SCREEN_REQUEST'
          ).map(request => (
            <div key={request.id} className="task-pending" style={{marginBottom: '1rem'}}>
              <div className="task-content">
                <span className="task-label">⏳ {request.label}</span>
              </div>
              <div className="task-status">Pending Parent Approval</div>
            </div>
          ))}

          <div className="help-text">
            You have {app.ledger.filter(l => l.childId === child.id).reduce((a, b) => a + b.points, 0)} points available.
            Each minute costs {s.pointPerMinute} point{s.pointPerMinute !== 1 ? 's' : ''}.
          </div>
          
          <div className="grid grid-3">
            <button className="btn" onClick={() => requestScreenTime(15)}>
              15 min (15 pts)
            </button>
            <button className="btn" onClick={() => requestScreenTime(30)}>
              30 min (30 pts)
            </button>
            <button className="btn" onClick={() => requestScreenTime(60)}>
              60 min (60 pts)
            </button>
          </div>
          
          <div className="grid grid-2">
            <button className="btn" onClick={() => requestScreenTime(90)}>
              90 min (90 pts)
            </button>
            <button className="btn" onClick={() => requestScreenTime(120)}>
              120 min (120 pts)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
