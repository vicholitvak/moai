import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { Search, Eye, EyeOff } from "lucide-react"

export interface ModernInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof HTMLMotionProps<"input">> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  variant?: "default" | "glass" | "minimal"
  inputSize?: "sm" | "md" | "lg"
  className?: string
  type?: string
}

const ModernInput = React.forwardRef<HTMLInputElement, ModernInputProps>(
  ({
    className,
    type = "text",
    label,
    error,
    helperText,
    icon,
    variant = "default",
    inputSize = "md",
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const inputType = type === "password" && showPassword ? "text" : type

    const variants = {
      default: "bg-white border-2 border-gray-200 focus:border-moai-500",
      glass: "bg-white/80 backdrop-blur-md border border-white/30 focus:border-white/50",
      minimal: "bg-transparent border-b-2 border-gray-300 focus:border-moai-500"
    }

    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-4 text-base",
      lg: "h-13 px-5 text-lg"
    }

    return (
      <div className="space-y-2">
        {label && (
          <motion.label
            className="block text-sm font-medium text-gray-700"
            animate={{ color: isFocused ? "#F97316" : "#374151" }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}

          {/* Input */}
          <motion.input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full rounded-xl transition-all duration-300 outline-none",
              "placeholder:text-gray-400 focus:placeholder:text-gray-300",
              variants[variant],
              sizes[inputSize],
              icon && "pl-10",
              (type === "password" || type === "search") && "pr-10",
              error && "border-red-500 focus:border-red-500",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            {...(props as any)}
          />

          {/* Password Toggle */}
          {type === "password" && (
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Search Icon */}
          {type === "search" && (
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          )}

          {/* Focus Ring */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-moai-500/10 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: isFocused ? 1 : 0,
              scale: isFocused ? 1 : 0.95
            }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            className="text-sm text-red-600"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

ModernInput.displayName = "ModernInput"

export { ModernInput }
