import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - mobil-first approach
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-manipulation",
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-purple-600 to-blue-600", 
          "text-white shadow-lg shadow-purple-500/25",
          "hover:shadow-xl hover:shadow-purple-500/40",
          "hover:from-purple-700 hover:to-blue-700",
          "border border-purple-500/20"
        ],
        secondary: [
          "bg-gray-800/80 text-white border border-gray-600/50",
          "hover:bg-gray-700/80 hover:border-gray-500/70",
          "shadow-md backdrop-blur-sm"
        ],
        ghost: [
          "text-purple-400 hover:text-purple-300",
          "hover:bg-purple-500/10 border border-transparent",
          "hover:border-purple-500/30"
        ],
        neon: [
          "bg-transparent border-2 border-cyan-400",
          "text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]",
          "hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]",
          "hover:bg-cyan-400/10"
        ]
      },
      size: {
        sm: "h-10 px-4 text-sm min-w-[80px]", // Mobil için minimum genişlik
        default: "h-12 px-6 text-base min-w-[120px]", // Mobil touch target
        lg: "h-14 px-8 text-lg min-w-[160px]", // Büyük mobil
        icon: "h-12 w-12", // Square touch target
        full: "h-12 w-full" // Full width mobil
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
