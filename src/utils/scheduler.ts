import { useApp } from '../state/store'

// Schedule daily task reset at 6AM
export function scheduleDailyReset() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(6, 0, 0, 0) // 6:00 AM
  
  const msUntilReset = tomorrow.getTime() - now.getTime()
  
  console.log(`Daily task reset scheduled for ${tomorrow.toLocaleString()}`)
  
  setTimeout(() => {
    console.log('Running daily task reset at 6AM')
    useApp.getState().dailyTaskReset()
    
    // Schedule the next reset for the following day
    scheduleDailyReset()
  }, msUntilReset)
}

// Initialize the scheduler when the app starts
export function initializeScheduler() {
  scheduleDailyReset()
}
