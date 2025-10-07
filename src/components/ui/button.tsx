import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "../../lib/utils"
import { buttonPress, getTransition } from "../../theme/motion"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-md hover:shadow-lg",
        destructive: "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 shadow-md hover:shadow-lg",
        outline: "border-2 border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 text-neutral-900",
        secondary: "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-md hover:shadow-lg",
        ghost: "hover:bg-neutral-100 active:bg-neutral-200 text-neutral-700 hover:text-neutral-900",
        link: "text-primary-500 underline-offset-4 hover:underline hover:text-primary-600",
        success: "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-md hover:shadow-lg",
        warning: "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 shadow-md hover:shadow-lg",
      },
      size: {
        default: "h-10 min-h-[40px] px-4 py-2 text-sm",
        sm: "h-9 min-h-[36px] rounded-md px-3 text-xs",
        lg: "h-12 min-h-[48px] rounded-lg px-8 text-base",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<"button">>,
    VariantProps<typeof buttonVariants>,
    Omit<HTMLMotionProps<"button">, "className"> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    children,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        whileHover={!isDisabled ? "hover" : undefined}
        whileTap={!isDisabled ? "tap" : undefined}
        variants={buttonPress}
        transition={getTransition({ duration: 0.15 })}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {!loading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

