import { useState, useEffect } from 'react'
import { useApp } from '../state/store'

interface ScreenTimeTimerProps {
  childId: string
  minutes: number
  onComplete: () => void
}

export default function ScreenTimeTimer({ childId, minutes, onComplete }: ScreenTimeTimerProps) {
  const app = useApp()
  const session = app.screenTimeSessions[childId]
  
  // Calculate remaining time from session
  const getRemainingTime = () => {
    if (!session) return minutes * 60
    
    if (session.status === 'completed') return 0
    
    const now = Date.now()
    let elapsedMs = now - session.startTime
    
    // Subtract total paused time
    if (session.status === 'paused' && session.pausedAt) {
      elapsedMs -= (now - session.pausedAt)
    }
    elapsedMs -= session.totalPausedTime
    
    // Calculate remaining time in seconds (not minutes)
    const totalSeconds = session.totalMinutes * 60
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    
    return remaining
  }
  
  const [timeLeft, setTimeLeft] = useState(getRemainingTime())
  const [isRunning, setIsRunning] = useState(session?.status === 'running' || false)
  const [isCompleted, setIsCompleted] = useState(session?.status === 'completed' || false)

  // Update timeLeft when session changes
  useEffect(() => {
    const remaining = getRemainingTime()
    setTimeLeft(remaining)
    setIsRunning(session?.status === 'running' || false)
    setIsCompleted(session?.status === 'completed' || false)
  }, [session])

  // Main timer effect - updates every second for smooth display
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        const remaining = getRemainingTime()
        setTimeLeft(remaining)
        
        if (remaining <= 0) {
          setIsRunning(false)
          setIsCompleted(true)
          app.endScreenTime(childId)
          onComplete()
        }
      }, 1000) // Update every second for smooth seconds display
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, onComplete, session])

  // Additional effect for smooth seconds display - updates every 100ms
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && session?.status === 'running') {
      interval = setInterval(() => {
        const remaining = getRemainingTime()
        setTimeLeft(remaining)
      }, 100) // Update every 100ms for smooth seconds display
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, session?.status])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    // If there's already a paused session, resume it instead of starting new
    if (session && session.status === 'paused') {
      app.resumeScreenTime(childId)
    } else {
      // Only start a new session if there isn't one already
      app.startScreenTime(childId, minutes)
    }
    setIsRunning(true)
  }

  const requestPause = () => {
    // Send pause request to parent
    const app = useApp.getState()
    app.addEarn(childId, 'PAUSE_REQUEST', 'Screen time pause request', 0)
    // Pause request sent - no alert needed
  }


  const resetTimer = () => {
    app.endScreenTime(childId)
    setIsCompleted(false)
    setIsRunning(false)
    setTimeLeft(minutes * 60)
  }

  if (isCompleted) {
    return (
      <div className="timer-completed">
        <div className="timer-icon">🎉</div>
        <div className="timer-text">Screen time completed!</div>
        <button className="btn primary" onClick={resetTimer}>
          Start New Session
        </button>
      </div>
    )
  }

  return (
    <div className="screen-timer">
      <div className="timer-display">
        <div className="timer-time">{formatTime(timeLeft)}</div>
        <div className="timer-label">Screen Time Remaining</div>
      </div>
      
      <div className="timer-controls">
        {!isRunning ? (
          <button className="btn primary" onClick={startTimer}>
            {session && session.status === 'paused' ? '▶️ Resume Timer' : '▶️ Start Timer'}
          </button>
        ) : (
          <button className="btn warn" onClick={requestPause}>
            ⏸️ Request Pause
          </button>
        )}
      </div>
    </div>
  )
}
