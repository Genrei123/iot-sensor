import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "destructive"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors"
    const variantClasses = {
      default: "bg-primary text-white hover:bg-primary/90",
      outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
      destructive: "bg-red-500 text-white hover:bg-red-600",
    }

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
