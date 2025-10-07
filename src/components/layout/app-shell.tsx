import * as React from "react"
import { useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import { Sidebar } from "./sidebar"
import { TopBar } from "./topbar"
import { Breadcrumb } from "../ui/breadcrumb"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const location = useLocation()
  
  // Check if we're in child view
  const isChildView = location.pathname.startsWith('/child')
  
  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Count notifications (placeholder - will be implemented with real data)
  const notificationCount = 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - hide for child view */}
      {!isChildView && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isChildView={isChildView}
        />
      )}

      {/* Main content area */}
      <div className={isChildView ? '' : 'lg:pl-64'}>
        {/* Top bar */}
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          isChildView={isChildView}
          notificationCount={notificationCount}
        />

        {/* Page content */}
        <main className="flex-1">
          <div className="p-4 lg:p-8 max-w-5xl mx-auto">
            {/* Breadcrumbs - hide for child view */}
            {!isChildView && (
              <div className="mb-6">
                <Breadcrumb />
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
