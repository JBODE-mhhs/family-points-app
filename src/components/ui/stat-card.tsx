import * as React from "react"
import { cn } from "../../lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl p-6 shadow-soft border border-gray-200 hover:shadow-lg transition-shadow",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={cn(
            "text-sm font-medium",
            trend.positive ? "text-success-600" : "text-error-600"
          )}>
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
          <span className="text-sm text-gray-500 ml-2">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
