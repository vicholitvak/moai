import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ModernLoadingProps {
  size?: "sm" | "md" | "lg"
  variant?: "spinner" | "dots" | "pulse" | "bars"
  text?: string
  className?: string
}

const ModernLoading = React.forwardRef<HTMLDivElement, ModernLoadingProps>(
  ({ size = "md", variant = "spinner", text, className }, ref) => {
    const sizes = {
      sm: "w-4 h-4",
      md: "w-8 h-8",
      lg: "w-12 h-12"
    }

    const Spinner = () => (
      <motion.div
        className={cn("border-2 border-moai-200 border-t-moai-500 rounded-full", sizes[size])}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    )

    const Dots = () => (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn("bg-moai-500 rounded-full", size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : "w-3 h-3")}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    )

    const Pulse = () => (
      <motion.div
        className={cn("bg-moai-500 rounded-full", sizes[size])}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    )

    const Bars = () => (
      <div className="flex space-x-1">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={cn("bg-moai-500 rounded-sm", size === "sm" ? "w-1" : size === "lg" ? "w-3" : "w-2")}
            animate={{
              height: size === "sm" ? ["4px", "16px", "4px"] : size === "lg" ? ["12px", "48px", "12px"] : ["8px", "32px", "8px"]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.1
            }}
          />
        ))}
      </div>
    )

    const renderLoader = () => {
      switch (variant) {
        case "dots":
          return <Dots />
        case "pulse":
          return <Pulse />
        case "bars":
          return <Bars />
        default:
          return <Spinner />
      }
    }

    return (
      <div ref={ref} className={cn("flex flex-col items-center justify-center space-y-3", className)}>
        {renderLoader()}
        {text && (
          <motion.p
            className="text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    )
  }
)

ModernLoading.displayName = "ModernLoading"

export { ModernLoading }
