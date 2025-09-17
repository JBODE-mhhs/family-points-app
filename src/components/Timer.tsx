import { useEffect, useState } from 'react'
import { useApp } from '../state/store'
import { hmToMinutes, nowLocalMinutes, toYMD, formatTime } from '../utils/date'
import { canStartBlockNow, getCutoffMinutes, spentScreenMinutesOnDate } from '../utils/logic'
import { Child } from '../types'

export default function Timer({ child, onSpend }: { child: Child; onSpend: () => void }) {
  const { household, timers, startTimer, clearTimer } = useApp()
  const t = timers[child.id]
  const settings = household!.settings
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    let handle: any
    if (t?.status === 'running' && t.endTime) {
      const tick = () => {
        const left = Math.max(0, Math.floor((t.endTime! - Date.now())/1000))
        setSecondsLeft(left)
        if (left <= 0) {
          clearTimer(child.id)
          onSpend()
        }
      }
      tick()
      handle = setInterval(tick, 1000)
    }
    return () => handle && clearInterval(handle)
  }, [t?.status, t?.endTime])

  const start = () => {
    const date = new Date()
    const ymd = toYMD(date)
    const spent = spentScreenMinutesOnDate(useApp.getState().ledger, child.id, ymd, settings)
    const check = canStartBlockNow(child, date, nowLocalMinutes(), spent, settings)
    if (!check.ok) { alert(check.reason); return }
    const endTime = Date.now() + settings.blockMinutes * 60 * 1000
    startTimer(child.id, endTime)
  }

  const cutoff = getCutoffMinutes(child, new Date(), settings)
  const cutoffTime = new Date()
  cutoffTime.setHours(Math.floor(cutoff/60), cutoff%60, 0, 0)
  const cutoffStr = formatTime(cutoffTime, settings.timezone)

  if (t?.status === 'running') {
    const m = Math.floor((secondsLeft ?? 0)/60)
    const s = (secondsLeft ?? 0) % 60
    return (
      <div className="card">
        <div className="row">
          <div><strong>Timer</strong> (30 min block)</div>
          <button className="btn bad" onClick={() => { clearTimer(child.id) }}>Stop</button>
        </div>
        <div style={{fontSize:40, fontWeight:700}}>{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</div>
        <div className="small">Auto-logs spend when it hits 00:00.</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="row">
        <div><strong>Timer</strong> (30 min block)</div>
        <button className="btn primary" onClick={start}>Start</button>
      </div>
      <div className="small">Must end before cut-off <strong>{cutoffStr}</strong>. App enforces daily cap & cut-off.</div>
    </div>
  )
}
