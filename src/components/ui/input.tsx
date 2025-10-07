import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg bg-white px-4 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50",
  {
    variants: {
      variant: {
        default:
          "border-2 border-neutral-200 focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-100",
        error:
          "border-2 border-error-500 focus-visible:border-error-600 focus-visible:ring-4 focus-visible:ring-error-100",
        success:
          "border-2 border-success-500 focus-visible:border-success-600 focus-visible:ring-4 focus-visible:ring-success-100",
      },
      inputSize: {
        default: "h-10 text-sm",
        sm: "h-9 text-xs px-3",
        lg: "h-12 text-base px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, error, success, ...props }, ref) => {
    // Determine variant based on props
    const computedVariant = error ? "error" : success ? "success" : variant

    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: computedVariant, inputSize }),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

