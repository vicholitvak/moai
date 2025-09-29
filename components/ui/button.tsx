import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-atacama-orange to-orange-600 text-white shadow-lg hover:shadow-xl hover:shadow-atacama-orange/25 border-0 hover:from-orange-600 hover:to-orange-700",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 hover:from-red-600 hover:to-red-700",
        outline:
          "border-2 border-atacama-beige/40 bg-background/80 backdrop-blur-sm shadow-sm hover:bg-atacama-beige/10 hover:text-atacama-brown hover:border-atacama-orange/50 hover:shadow-md",
        secondary:
          "bg-gradient-to-r from-pacific-500 to-pacific-600 text-white shadow-lg hover:shadow-xl hover:shadow-pacific-500/25 hover:from-pacific-600 hover:to-pacific-700",
        ghost:
          "hover:bg-atacama-beige/20 hover:text-atacama-brown hover:backdrop-blur-sm",
        link: "text-atacama-orange underline-offset-4 hover:underline hover:text-atacama-orange/80 p-0 h-auto shadow-none hover:shadow-none",
        glass:
          "bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20 hover:shadow-xl",
        premium:
          "bg-gradient-to-r from-amber-400 via-atacama-orange to-red-500 text-white shadow-lg hover:shadow-xl hover:shadow-atacama-orange/30 hover:from-amber-500 hover:via-orange-600 hover:to-red-600",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg gap-1.5 px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  glow?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon,
      glow = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {/* Shimmer Effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Glow Effect */}
        {glow && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-atacama-orange/20 to-orange-500/20 blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
        )}

        {/* Loading Spinner */}
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Icon */}
        {icon && !loading && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {icon}
          </motion.div>
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
