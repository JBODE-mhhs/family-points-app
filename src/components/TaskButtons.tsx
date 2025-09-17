import { useMemo } from 'react'
import { useApp } from '../state/store'
import { Child, TaskDef } from '../types'
import { extrasEarnedOnDate, baselineDone } from '../utils/logic'
import { toYMD } from '../utils/date'

export default function TaskButtons({ child, date }:{ child: Child; date: Date }){
  const app = useApp()
  const ymd = toYMD(date)
  const s = app.household!.settings

  const base = s.baselineTasks
  const extra = useMemo(() => s.extraTasks.filter(t => !t.ageMin || child.age >= t.ageMin), [s.extraTasks, child.age])

  const done = (code: string) => baselineDone(app.ledger, child.id, ymd, code)
  const extrasEarned = extrasEarnedOnDate(app.ledger, child.id, ymd)
  const extrasCap = (date.getDay() === 0 || date.getDay() === 6) ? s.extrasCapWeekend : s.extrasCapSchool

  const add = (t: TaskDef) => {
    if (t.category === 'baseline' && done(t.code)) return
    if (t.category === 'extra' && (extrasEarned + t.points > extrasCap)) {
      alert(`Extras cap reached for today (max +${extrasCap} points).`); return
    }
    app.addEarn(child.id, t.code, t.label, t.points)
  }

  const getTaskStatus = (code: string) => {
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

  const getTaskButton = (t: TaskDef) => {
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
          <span className="task-label">{t.label}</span>
          <span className="task-points">+{t.points}</span>
          <div className="task-status">Not completed</div>
        </div>
      )
    }

    if (status === 'verified') {
      return (
        <div key={t.id} className="task-verified">
          <span className="task-label">✓ {t.label}</span>
          <span className="task-points">+{t.points}</span>
          <div className="task-status">Verified by parent</div>
        </div>
      )
    }

    if (status === 'pending-verification') {
      return (
        <div key={t.id} className="task-pending">
          <span className="task-label">⏳ {t.label}</span>
          <span className="task-points">+{t.points}</span>
          <div className="task-status">Waiting for parent verification</div>
        </div>
      )
    }

    if (status === 'incomplete') {
      return (
        <div key={t.id} className="task-incomplete">
          <span className="task-label">✗ {t.label}</span>
          <span className="task-points">+{entry?.points || 0} (penalized)</span>
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
            <div className="section-title">Daily Tasks</div>
            <div className="section-subtitle">Complete these to earn points</div>
          </div>
        </div>
        
        <div className="task-section">
          <div className="task-category">
            <h4>Baseline Tasks</h4>
            <div className="help-text">Complete these daily tasks to earn points. Parents can verify completion.</div>
            <div className="task-grid">
              {base.map(getTaskButton)}
            </div>
          </div>
          
          <div className="task-category">
            <h4>Extra Tasks <span className="tag">earned {extrasEarned}/{extrasCap}</span></h4>
            <div className="help-text">Additional tasks for extra points. Limited per day to encourage balance.</div>
            <div className="task-grid">
              {extra.map(getTaskButton)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
