import * as React from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { useTheme } from "../theme-provider"
import { 
  Menu, 
  Sun, 
  Moon, 
  Bell,
  User
} from "lucide-react"

interface TopBarProps {
  onMenuClick: () => void
  isChildView?: boolean
  notificationCount?: number
}

export function TopBar({ onMenuClick, isChildView = false, notificationCount = 0 }: TopBarProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🏠</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-gray-900">Family Points</span>
              {isChildView && (
                <Badge variant="secondary" className="ml-2">
                  Kid Mode
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          {notificationCount > 0 && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notificationCount}
              </Badge>
            </Button>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User menu placeholder */}
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
