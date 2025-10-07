import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const location = useLocation()
  
  // Check if we're in child view
  const isChildView = location.pathname.startsWith('/child/')
  
  // Auto-generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    
    // For child view, show kid-friendly breadcrumbs
    if (isChildView) {
      return [
        { label: '🏠 My Dashboard', href: undefined, icon: <Home className="h-4 w-4" /> }
      ]
    }
    
    // For parent view, show normal breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/parent', icon: <Home className="h-4 w-4" /> }
    ]
    
    if (pathSegments.length === 0) return breadcrumbs
    
    const pathMap: Record<string, string> = {
      'parent': 'Dashboard',
      'child': 'Child View',
      'settings': 'Settings',
      'bank': 'Bank',
      'activity': 'Activity',
      'tasks': 'Tasks',
      'children': 'Children'
    }
    
    pathSegments.forEach((segment, index) => {
      if (segment === 'parent' && index === 0) return // Skip duplicate home
      
      const href = '/' + pathSegments.slice(0, index + 1).join('/')
      const label = pathMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      // Don't make the last item clickable
      const isLast = index === pathSegments.length - 1
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : href
      })
    })
    
    return breadcrumbs
  }
  
  const breadcrumbItems = items || generateBreadcrumbs()
  
  return (
    <nav className={cn(
      "flex items-center space-x-1 text-sm", 
      isChildView ? "text-kid-primary font-semibold" : "text-gray-500",
      className
    )}>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          {item.href ? (
            <Link
              to={item.href}
              className={cn(
                "flex items-center space-x-1 transition-colors",
                isChildView 
                  ? "hover:text-kid-secondary text-kid-primary" 
                  : "hover:text-gray-700 text-gray-500"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className={cn(
              "flex items-center space-x-1 font-medium",
              isChildView 
                ? "text-kid-primary" 
                : "text-gray-900"
            )}>
              {item.icon}
              <span>{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

