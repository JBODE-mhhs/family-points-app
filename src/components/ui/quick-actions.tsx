import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
  Zap,
  TrendingUp,
  AlertCircle
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
  const menuRef = useRef<HTMLDivElement>(null)
  const app = useApp()
  const navigate = useNavigate()

  const quickActions: QuickAction[] = [
    {
      id: "add-points",
      label: "Add Points",
      description: "Quickly add points to a child",
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        if (!app.household?.children?.length) {
          alert("No family setup found! Please set up your family first by going to Settings.")
          return
        }
        
        const childName = prompt("Which child? (Enter name)")
        if (!childName) return
        const points = prompt("How many points to add?")
        if (!points || isNaN(Number(points))) return
        
        const child = app.household?.children.find(c => 
          c.name.toLowerCase() === childName.toLowerCase()
        )
        if (!child) {
          alert("Child not found!")
          return
        }
        
        app.addEarn(child.id, 'QUICK_BONUS', `Quick bonus from parent`, Number(points))
        alert(`Added ${points} points to ${child.name}!`)
      },
      variant: "success"
    },
    {
      id: "screen-time",
      label: "Screen Time",
      description: "Start screen time for a child",
      icon: <Clock className="h-4 w-4" />,
      action: () => {
        if (!app.household?.children?.length) {
          alert("No family setup found! Please set up your family first by going to Settings.")
          return
        }
        
        const childName = prompt("Which child? (Enter name)")
        if (!childName) return
        const minutes = prompt("How many minutes?")
        if (!minutes || isNaN(Number(minutes))) return
        
        const child = app.household?.children.find(c => 
          c.name.toLowerCase() === childName.toLowerCase()
        )
        if (!child) {
          alert("Child not found!")
          return
        }
        
        const cost = Number(minutes) * (app.household?.settings.pointPerMinute || 1)
        if (confirm(`Start ${minutes} minutes of screen time for ${child.name}? Cost: ${cost} points`)) {
          app.startScreenTime(child.id, Number(minutes))
          alert(`Started ${minutes} minutes of screen time for ${child.name}!`)
        }
      },
      variant: "default"
    },
    {
      id: "cash-out",
      label: "Cash Out",
      description: "Process cash-out requests",
      icon: <DollarSign className="h-4 w-4" />,
      action: () => {
        console.log("Cash Out clicked, navigating to /bank")
        navigate("/bank")
      },
      variant: "warning"
    },
    {
      id: "verify-tasks",
      label: "Verify Tasks",
      description: "Review pending task completions",
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => {
        // Scroll to pending requests section
        const pendingSection = document.querySelector('[data-section="pending-requests"]')
        if (pendingSection) {
          pendingSection.scrollIntoView({ behavior: 'smooth' })
        } else {
          alert("No pending tasks found!")
        }
      },
      variant: "default"
    },
    {
      id: "settings",
      label: "Settings",
      description: "Open settings page",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        console.log("Settings clicked, navigating to /settings")
        navigate("/settings")
      },
      variant: "default"
    }
  ]
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
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
        <div ref={menuRef} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-xs text-gray-500">Common tasks and shortcuts</p>
          </div>
          
          <div className="p-3">
            <div className="grid grid-cols-1 gap-1">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    console.log("Quick action clicked:", action.id)
                    action.action()
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
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
        </div>
      )}
    </div>
  )
}

