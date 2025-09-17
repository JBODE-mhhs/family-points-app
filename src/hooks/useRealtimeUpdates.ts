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
  
  return refreshKey
}
