import { useEffect } from 'react'
import { useApp } from '../state/store'
import { todayYMD } from '../utils/date'

export function useAutoReset() {
  const app = useApp()
  const settings = app.household?.settings

  useEffect(() => {
    if (!settings || !settings.autoResetEnabled || !settings.autoResetTime) {
      return
    }

    const checkAndReset = () => {
      const now = new Date()
      const today = todayYMD()

      // Parse the reset time (default to midnight if invalid)
      const resetTime = settings.autoResetTime || '00:00'
      const [hours, minutes] = resetTime.split(':').map(Number)

      // Get current time in HH:MM format
      const currentHours = now.getHours()
      const currentMinutes = now.getMinutes()

      console.log('Auto-reset check:', {
        currentTime: `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`,
        resetTime,
        today,
        lastResetDate: settings.lastAutoResetDate,
        enabled: settings.autoResetEnabled
      })

      // Check if we're at or past the reset time
      const isPastResetTime =
        currentHours > hours ||
        (currentHours === hours && currentMinutes >= minutes)

      console.log('isPastResetTime:', isPastResetTime)

      // Only reset if:
      // 1. We're past the reset time today
      // 2. We haven't already reset today
      // 3. Auto-reset is enabled
      if (
        isPastResetTime &&
        settings.lastAutoResetDate !== today &&
        settings.autoResetEnabled
      ) {
        console.log('🔄 Running auto-reset for', today)

        // Run the reset
        app.resetTodayTasks()

        // Update the last reset date
        app.updateSettings(s => ({
          ...s,
          lastAutoResetDate: today
        }))
      } else {
        console.log('Auto-reset skipped:', {
          isPastResetTime,
          alreadyResetToday: settings.lastAutoResetDate === today,
          enabled: settings.autoResetEnabled
        })
      }
    }

    // Check immediately on mount
    checkAndReset()

    // Then check every minute
    const interval = setInterval(checkAndReset, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [settings?.autoResetEnabled, settings?.autoResetTime, settings?.lastAutoResetDate, app])
}
