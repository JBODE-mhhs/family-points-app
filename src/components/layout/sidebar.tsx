import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { 
  Home, 
  Users, 
  CheckSquare, 
  Activity, 
  Banknote, 
  Settings,
  X
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isChildView?: boolean
}

const navigation = [
  { name: 'Dashboard', href: '/parent', icon: Home, description: 'Overview & quick actions' },
  { name: 'Children', href: '/parent', icon: Users, description: 'Manage children' },
  { name: 'Tasks', href: '/parent', icon: CheckSquare, description: 'Task management' },
  { name: 'Activity', href: '/parent', icon: Activity, description: 'Transaction history' },
  { name: 'Bank', href: '/bank', icon: Banknote, description: 'Cash-out requests' },
  { name: 'Settings', href: '/settings', icon: Settings, description: 'System configuration' },
]

const childNavigation = [
  { name: 'My Dashboard', href: '/child', icon: Home, description: 'My points & tasks' },
  { name: 'Bank', href: '/child/bank', icon: Banknote, description: 'Cash-out requests' },
]

export function Sidebar({ isOpen, onClose, isChildView = false }: SidebarProps) {
  const location = useLocation()
  const navItems = isChildView ? childNavigation : navigation

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏠</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Family Points</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  title={item.description}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="flex-1">
                    <span>{item.name}</span>
                    <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              {isChildView ? "Kid Mode" : "Parent Mode"}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
