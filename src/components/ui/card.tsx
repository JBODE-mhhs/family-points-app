import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { cardHover, fadeVariants, getTransition } from "../../theme/motion"

const cardVariants = cva(
  "rounded-xl bg-white text-neutral-900 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border border-neutral-200 shadow-md",
        elevated: "shadow-elevation-2",
        outlined: "border-2 border-neutral-200",
        ghost: "border border-transparent",
      },
      padding: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        none: "p-0",
      },
      interactive: {
        true: "cursor-pointer active:shadow-elevation-1",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      interactive: false,
    },
  }
)

interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof HTMLMotionProps<"div">>,
    VariantProps<typeof cardVariants>,
    Omit<HTMLMotionProps<"div">, "className"> {
  hover?: boolean
  animate?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, hover = false, animate = false, ...props }, ref) => {
    const useMotion = animate || hover
    const Component = useMotion ? motion.div : "div"

    const motionProps = animate
      ? {
          initial: "hidden",
          animate: "visible",
          exit: "exit",
          variants: fadeVariants,
        }
      : {}

    const hoverProps = hover && !interactive
      ? {
          whileHover: "hover",
          variants: cardHover,
          transition: getTransition({ duration: 0.2 }),
        }
      : {}

    return (
      <Component
        ref={ref}
        className={cn(cardVariants({ variant, padding, interactive, className }))}
        {...motionProps}
        {...hoverProps}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-neutral-900",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-500 leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-3 p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

