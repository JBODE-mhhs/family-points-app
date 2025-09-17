import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../state/store'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('parent' | 'child')[]
}

export default function ProtectedRoute({ children, allowedRoles = ['parent'] }: ProtectedRouteProps) {
  const location = useLocation()
  const household = useApp(s => s.household)
  
  if (!household) {
    return <Navigate to="/" replace />
  }
  
  // Check if we're in a child view
  const isChildView = location.pathname.startsWith('/child/')
  const isChildRoute = allowedRoles.includes('child')
  const isParentRoute = allowedRoles.includes('parent')
  
  // Simple logic: if it's a child view, only allow child routes
  // If it's not a child view, only allow parent routes
  if (isChildView && !isChildRoute) {
    return <Navigate to="/parent" replace />
  }
  
  if (!isChildView && !isParentRoute) {
    return <Navigate to="/parent" replace />
  }
  
  return <>{children}</>
}
