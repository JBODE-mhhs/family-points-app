import { useEffect, useState } from 'react'
import { useApp } from '../state/store'
import { useGlobalRefresh } from './useGlobalRefresh'

export function useRealtimeUpdates() {
  const [refreshKey, setRefreshKey] = useState(0)
  const globalRefreshKey = useGlobalRefresh()

  // Force re-render every 500ms for more responsive updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 500) // More frequent updates

    return () => clearInterval(interval)
  }, [])

  // Also trigger refresh when global refresh happens
  useEffect(() => {
    setRefreshKey(globalRefreshKey)
  }, [globalRefreshKey])

  // Subscribe to store changes for immediate updates
  useEffect(() => {
    let prevState = useApp.getState()

    const unsubscribe = useApp.subscribe((state) => {
      if (state.ledger !== prevState.ledger) {
        console.log('Ledger changed, forcing refresh')
        setRefreshKey(prev => prev + 1)
      }

      if (state.screenTimeSessions !== prevState.screenTimeSessions) {
        console.log('Screen time sessions changed, forcing refresh')
        setRefreshKey(prev => prev + 1)
      }

      if (state.timers !== prevState.timers) {
        console.log('Timers changed, forcing refresh')
        setRefreshKey(prev => prev + 1)
      }

      if (state.household !== prevState.household) {
        console.log('Household changed, forcing refresh')
        setRefreshKey(prev => prev + 1)
      }

      prevState = state
    })

    return unsubscribe
  }, [])

  // Listen for storage events to sync across tabs/windows
  useEffect(() => {
    // Flag to track if we're currently updating storage (to prevent self-triggering)
    let isUpdatingStorage = false

    const handleStorageChange = (e: StorageEvent) => {
      // Ignore events we triggered ourselves
      if (isUpdatingStorage) {
        return
      }

      // Storage event should only fire on OTHER tabs, not the current one
      // If it fires on the same tab, it's a browser bug - ignore it
      if (e.key === 'family-points-app' && e.newValue && e.oldValue !== e.newValue) {
        console.log('Storage changed in another tab, syncing state...')

        try {
          isUpdatingStorage = true

          // Parse the new state from localStorage
          const newState = JSON.parse(e.newValue)

          // Get the current Zustand state
          const currentState = useApp.getState()

          // Deep equality check to prevent unnecessary updates
          const currentStateStr = JSON.stringify({
            household: currentState.household,
            ledger: currentState.ledger,
            timers: currentState.timers,
            cashOutRequests: currentState.cashOutRequests,
            screenTimeSessions: currentState.screenTimeSessions
          })

          const newStateStr = JSON.stringify(newState.state)

          // Only update if state actually changed
          if (currentStateStr !== newStateStr) {
            // Manually update the Zustand store with the new state
            useApp.setState(newState.state)
            console.log('State synced from another tab')

            // Force a refresh
            setRefreshKey(prev => prev + 1)
          } else {
            console.log('Storage event received but state unchanged, skipping sync')
          }
        } catch (error) {
          console.error('Error syncing state from storage event:', error)
        } finally {
          // Reset flag after a short delay
          setTimeout(() => {
            isUpdatingStorage = false
          }, 100)
        }
      }
    }

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return refreshKey
}
