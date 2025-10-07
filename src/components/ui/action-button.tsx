import * as React from "react"
import { Button } from "./button"
import { cn } from "../../lib/utils"

interface ActionButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: "approve" | "deny" | "warning" | "info"
  size?: "sm" | "md" | "lg"
  className?: string
  disabled?: boolean
}

const variantStyles = {
  approve: "bg-success-500 hover:bg-success-600 text-white",
  deny: "bg-error-500 hover:bg-error-600 text-white",
  warning: "bg-warning-500 hover:bg-warning-600 text-white",
  info: "bg-primary-500 hover:bg-primary-600 text-white",
}

const sizeStyles = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
}

export function ActionButton({ 
  children, 
  onClick, 
  variant = "info", 
  size = "md",
  className,
  disabled = false
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </button>
  )
}

