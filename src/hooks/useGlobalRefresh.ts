import { useEffect, useState } from 'react'

// Global refresh state that all components can subscribe to
let globalRefreshKey = 0
const refreshListeners = new Set<() => void>()

export function useGlobalRefresh() {
  const [refreshKey, setRefreshKey] = useState(globalRefreshKey)
  
  useEffect(() => {
    const listener = () => {
      setRefreshKey(globalRefreshKey)
    }
    
    refreshListeners.add(listener)
    
    return () => {
      refreshListeners.delete(listener)
    }
  }, [])
  
  return refreshKey
}

export function triggerGlobalRefresh() {
  globalRefreshKey++
  refreshListeners.forEach(listener => listener())
}

// Force refresh every 2 seconds as a fallback
setInterval(() => {
  triggerGlobalRefresh()
}, 2000)
