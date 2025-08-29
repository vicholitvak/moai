import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface ModernCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof HTMLMotionProps<"div">> {
  variant?: "default" | "glass" | "elevated" | "bordered" | "gradient"
  hover?: boolean
  glow?: boolean
  children: React.ReactNode
  className?: string
}

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, variant = "default", hover = true, glow = false, children, ...props }, ref) => {
    const baseClasses = "relative rounded-2xl transition-all duration-300 overflow-hidden"

    const variants = {
      default: "bg-white border border-gray-200 shadow-sm",
      glass: "bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl",
      elevated: "bg-white shadow-lg border border-gray-100",
      bordered: "bg-white border-2 border-moai-200 shadow-sm",
      gradient: "bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md"
    }

    const hoverClasses = hover
      ? "hover:shadow-xl hover:shadow-moai-500/10 hover:-translate-y-1 hover:border-moai-300"
      : ""

    const glowClasses = glow
      ? "hover:shadow-2xl hover:shadow-moai-500/20"
      : ""

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          hoverClasses,
          glowClasses,
          className
        )}
        whileHover={hover ? { scale: 1.02 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...(props as any)}
      >
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Animated border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-moai-500/20 via-pacific-500/20 to-moai-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
    )
  }
)

ModernCard.displayName = "ModernCard"

export { ModernCard }
