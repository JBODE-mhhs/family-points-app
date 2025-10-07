import { Routes, Route, Navigate } from 'react-router-dom'
import Setup from './pages/Setup'
import ParentDashboard from './pages/ParentDashboard'
import ChildDashboard from './pages/ChildDashboard'
import Settings from './pages/Settings'
import BankDay from './pages/BankDay'
import InstallPrompt from './components/InstallPrompt'
import { AppShell } from './components/layout/app-shell'
import { ThemeProvider } from './components/theme-provider'
import { ErrorBoundary } from './components/error-boundary'
import { PerformanceMonitor } from './components/performance-monitor'
import { useApp } from './state/store'
import { useAutoReset } from './hooks/useAutoReset'
import { GlobalDialog } from './components/GlobalDialog'

export default function App(){
  console.log('App component rendering...')
  useAutoReset() // Enable automatic daily reset

  try {
    const h = useApp(s => s.household)
    console.log('Household data:', h)
    
    // Setup page doesn't need the app shell
    if (!h) {
      return (
        <ThemeProvider defaultTheme="light" storageKey="family-points-theme">
          <InstallPrompt />
          <Routes>
            <Route path="/" element={<Setup/>} />
            <Route path="*" element={<Navigate to="/" replace/>} />
          </Routes>
        </ThemeProvider>
      )
    }
    
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light" storageKey="family-points-theme">
          <InstallPrompt />
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/parent" replace/>} />
              <Route path="/parent" element={<ParentDashboard/>} />
              <Route path="/child/:childId" element={<ChildDashboard/>} />
              <Route path="/settings" element={<Settings/>} />
              <Route path="/bank" element={<BankDay/>} />
              <Route path="*" element={<Navigate to="/" replace/>} />
            </Routes>
          </AppShell>
          <PerformanceMonitor />
          <GlobalDialog />
        </ThemeProvider>
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('App error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading App</h1>
          <p className="text-gray-600 mb-4">There was an error loading the application.</p>
          <p className="text-sm text-gray-500 mb-6">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}
