import * as React from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { cn } from "../../lib/utils"
import { fadeVariants, cardHover, counterSpring } from "../../theme/motion"
import { TrendingUp, TrendingDown } from "lucide-react"

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
  animateValue?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  animateValue = true,
}: StatCardProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const [displayValue, setDisplayValue] = React.useState(value)

  React.useEffect(() => {
    if (animateValue && typeof value === 'number') {
      const controls = animate(count, value, {
        ...counterSpring,
        onUpdate: (latest) => {
          setDisplayValue(Math.round(latest))
        },
      })
      return controls.stop
    } else {
      setDisplayValue(value)
    }
  }, [value, animateValue, count])

  return (
    <motion.div
      className={cn(
        "group bg-gradient-to-br from-white to-neutral-50 rounded-2xl p-6 shadow-elevation-2 border border-neutral-200/50 hover:shadow-elevation-3 transition-all duration-300",
        className
      )}
      initial="hidden"
      animate="visible"
      variants={fadeVariants}
      whileHover="hover"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500 mb-2 tracking-wide uppercase">
            {title}
          </p>
          <motion.p
            className="text-4xl font-bold text-neutral-900 tracking-tight mb-1 tabular-nums"
            layout
          >
            {displayValue}
          </motion.p>
          {subtitle && (
            <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <motion.div
            className="flex-shrink-0 p-3 rounded-xl bg-primary-50 text-primary-500 group-hover:bg-primary-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
      {trend && (
        <motion.div
          className="mt-4 flex items-center gap-2 pt-4 border-t border-neutral-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-sm font-semibold",
            trend.positive
              ? "bg-success-50 text-success-700"
              : "bg-error-50 text-error-700"
          )}>
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.positive ? "+" : ""}{trend.value}%
          </div>
          <span className="text-sm text-neutral-500">{trend.label}</span>
        </motion.div>
      )}
    </motion.div>
  )
}

