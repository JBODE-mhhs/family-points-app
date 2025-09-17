import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { 
  Plus, 
  X, 
  UserPlus, 
  DollarSign, 
  Clock, 
  CheckSquare,
  Settings,
  Zap
} from "lucide-react"
import { useApp } from "../../state/store"

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  action: () => void
  variant?: "default" | "success" | "warning" | "destructive"
}

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const app = useApp()
  
  const quickActions: QuickAction[] = [
    {
      id: "add-points",
      label: "Add Points",
      description: "Quickly add points to a child",
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        // This would open a modal in a real implementation
        alert("Add points functionality - would open modal")
      },
      variant: "success"
    },
    {
      id: "screen-time",
      label: "Screen Time",
      description: "Manage screen time sessions",
      icon: <Clock className="h-4 w-4" />,
      action: () => {
        // This would open screen time management
        alert("Screen time management - would open modal")
      },
      variant: "default"
    },
    {
      id: "cash-out",
      label: "Cash Out",
      description: "Process cash-out requests",
      icon: <DollarSign className="h-4 w-4" />,
      action: () => {
        // Navigate to bank page
        window.location.href = "/bank"
      },
      variant: "warning"
    },
    {
      id: "verify-tasks",
      label: "Verify Tasks",
      description: "Review pending task completions",
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => {
        // This would show pending tasks
        alert("Task verification - would show pending tasks")
      },
      variant: "default"
    },
    {
      id: "settings",
      label: "Settings",
      description: "Open settings page",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        window.location.href = "/settings"
      },
      variant: "default"
    }
  ]
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  return (
    <div className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <Zap className="h-4 w-4" />
        <span className="hidden sm:inline">Quick Actions</span>
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-xs text-gray-500">Common tasks and shortcuts</p>
          </div>
          
          <div className="p-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  action.action()
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  action.variant === "success" && "bg-green-100 text-green-600",
                  action.variant === "warning" && "bg-yellow-100 text-yellow-600",
                  action.variant === "destructive" && "bg-red-100 text-red-600",
                  action.variant === "default" && "bg-gray-100 text-gray-600"
                )}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
