import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "../../lib/utils"
import { scaleVariants, getTransition } from "../../theme/motion"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-500 text-white shadow-sm",
        secondary:
          "border-transparent bg-neutral-100 text-neutral-700",
        destructive:
          "border-transparent bg-error-500 text-white shadow-sm",
        success:
          "border-transparent bg-success-500 text-white shadow-sm",
        warning:
          "border-transparent bg-warning-500 text-white shadow-sm",
        outline:
          "border-2 border-neutral-200 bg-white text-neutral-700",
        info:
          "border-transparent bg-secondary-500 text-white shadow-sm",
      },
      size: {
        default: "text-xs px-3 py-1",
        sm: "text-[10px] px-2 py-0.5",
        lg: "text-sm px-4 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, keyof HTMLMotionProps<"span">>,
    VariantProps<typeof badgeVariants>,
    Omit<HTMLMotionProps<"span">, "className"> {
  animate?: boolean
  icon?: React.ReactNode
}

function Badge({
  className,
  variant,
  size,
  animate = false,
  icon,
  children,
  ...props
}: BadgeProps) {
  const Component = animate ? motion.span : "span"
  const motionProps = animate
    ? {
        initial: "hidden",
        animate: "visible",
        exit: "exit",
        variants: scaleVariants,
        transition: getTransition({ duration: 0.2 }),
      }
    : {}

  return (
    <Component
      className={cn(badgeVariants({ variant, size }), className)}
      {...motionProps}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </Component>
  )
}

export { Badge, badgeVariants }

