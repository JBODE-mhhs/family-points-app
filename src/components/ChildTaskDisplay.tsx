import { useState } from 'react'
import { useApp } from '../state/store'
import { Child, TaskDef } from '../types'
import { toYMD } from '../utils/date'

interface ChildTaskDisplayProps {
  child: Child
  date: Date
}

export default function ChildTaskDisplay({ child, date }: ChildTaskDisplayProps) {
  const app = useApp()
  const ymd = toYMD(date)
  const s = app.household!.settings
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [taskNote, setTaskNote] = useState('')
  const [taskPhoto, setTaskPhoto] = useState<string | null>(null)

  // Deduplicate tasks by ID to prevent duplicates
  const deduplicateById = <T extends { id: string }>(arr: T[]): T[] =>
    Array.from(new Map(arr.map(item => [item.id, item])).values())

  const base = deduplicateById(s.baselineTasks.filter(t => t.childId === child.id))
  const extra = deduplicateById(s.extraTasks.filter(t => t.childId === child.id && (!t.ageMin || child.age >= t.ageMin)))

  const getTaskStatus = (code: string) => {
    // Check if there's a pending request
    const pendingRequest = app.ledger.find(l =>
      l.childId === child.id &&
      l.date === ymd &&
      l.code === `REQUEST_${code}` &&
      l.type === 'earn'
    )
    if (pendingRequest) return 'pending-approval'

    const entry = app.ledger.find(l =>
      l.childId === child.id &&
      l.date === ymd &&
      l.code === code &&
      l.type === 'earn'
    )
    if (!entry) return 'not-done'
    if (entry.verified === true) return 'verified'
    if (entry.verified === false) return 'incomplete'
    return 'pending-verification'
  }

  const requestTaskCompletion = (task: TaskDef) => {
    if (!task) return
    
    // Add a request entry to the ledger
    app.addEarn(child.id, `REQUEST_${task.code}`, `Request: ${task.label}`, 0)
    setSelectedTask('')
    setTaskNote('')
    setTaskPhoto(null)
    // Request sent - dialog will close automatically
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setTaskPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getTaskCard = (t: TaskDef) => {
    const status = getTaskStatus(t.code)
    const entry = app.ledger.find(l => 
      l.childId === child.id && 
      l.date === ymd && 
      l.code === t.code && 
      l.type === 'earn'
    )

    if (status === 'not-done') {
      return (
        <div key={t.id} className="task-not-done">
          <div className="task-content">
            <span className="task-label">{t.label}</span>
            <span className="task-points">+{t.points} points</span>
          </div>
          <button 
            className="btn primary small" 
            onClick={() => setSelectedTask(t.code)}
          >
            Mark Complete
          </button>
        </div>
      )
    }

    if (status === 'verified') {
      return (
        <div key={t.id} className="task-verified">
          <div className="task-content">
            <span className="task-label">✅ {t.label}</span>
            <span className="task-points">+{t.points} points</span>
          </div>
          <div className="task-status">Verified by parent</div>
        </div>
      )
    }

    if (status === 'pending-approval') {
      return (
        <div key={t.id} className="task-pending">
          <div className="task-content">
            <span className="task-label">⏳ {t.label}</span>
            <span className="task-points">+{t.points} points</span>
          </div>
          <div className="task-status">Pending Approval</div>
        </div>
      )
    }

    if (status === 'pending-verification') {
      return (
        <div key={t.id} className="task-pending">
          <div className="task-content">
            <span className="task-label">⏳ {t.label}</span>
            <span className="task-points">+{t.points} points</span>
          </div>
          <div className="task-status">Waiting for parent verification</div>
        </div>
      )
    }

    if (status === 'incomplete') {
      return (
        <div key={t.id} className="task-incomplete">
          <div className="task-content">
            <span className="task-label">❌ {t.label}</span>
            <span className="task-points">+{entry?.points || 0} points (penalized)</span>
          </div>
          <div className="task-status">Marked incomplete by parent</div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="vstack">
      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">📋 My Tasks</div>
            <div className="section-subtitle">Complete these to earn points</div>
          </div>
        </div>
        
        <div className="task-section">
          <div className="task-category">
            <h4>Daily Tasks</h4>
            <div className="help-text">Complete these every day to earn points</div>
            <div className="task-grid">
              {base.map(getTaskCard)}
            </div>
          </div>
          
          <div className="task-category">
            <h4>Extra Tasks</h4>
            <div className="help-text">Additional tasks for extra points</div>
            <div className="task-grid">
              {extra.map(getTaskCard)}
            </div>
          </div>
        </div>
      </div>

      {/* Task Completion Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask('')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complete Task</h3>
              <button className="btn ghost" onClick={() => setSelectedTask('')}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="vstack">
                <div>
                  <label className="label">Task</label>
                  <div className="task-preview">
                    {[...base, ...extra].find(t => t.code === selectedTask)?.label}
                  </div>
                </div>
                
                <div>
                  <label className="label">Add a note (optional)</label>
                  <textarea 
                    className="input" 
                    value={taskNote}
                    onChange={(e) => setTaskNote(e.target.value)}
                    placeholder="Tell parent how you completed this task..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="label">Add a photo (optional)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload}
                    className="input"
                  />
                  {taskPhoto && (
                    <div className="photo-preview">
                      <img src={taskPhoto} alt="Task completion" style={{maxWidth: '200px', borderRadius: '8px'}} />
                    </div>
                  )}
                </div>
                
                <div className="modal-actions">
                  <button className="btn" onClick={() => setSelectedTask('')}>
                    Cancel
                  </button>
                  <button 
                    className="btn primary" 
                    onClick={() => {
                      const task = [...base, ...extra].find(t => t.code === selectedTask)
                      if (task) requestTaskCompletion(task)
                    }}
                  >
                    Send Request to Parent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
