import * as React from "react"
import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { ModernCard } from "./modern-card"
import { cn } from "@/lib/utils"

interface TestimonialProps {
  quote: string
  name: string
  role: string
  avatar?: string
  rating?: number
  className?: string
}

const ModernTestimonial = React.forwardRef<HTMLDivElement, TestimonialProps>(
  ({ quote, name, role, avatar, rating = 5, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("group", className)}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <ModernCard variant="glass" className="p-6 h-full">
          {/* Quote Icon */}
          <div className="flex justify-between items-start mb-4">
            <Quote className="w-8 h-8 text-moai-500/30" />
            {rating && (
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quote */}
          <blockquote className="text-gray-700 mb-6 leading-relaxed">
            "{quote}"
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-3">
            {avatar ? (
              <motion.img
                src={avatar}
                alt={name}
                className="w-12 h-12 rounded-full object-cover border-2 border-moai-100"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-moai-500 to-pacific-500 flex items-center justify-center text-white font-semibold">
                {name.charAt(0)}
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900">{name}</h4>
              <p className="text-sm text-gray-600">{role}</p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-moai-500/5 to-pacific-500/5 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
        </ModernCard>
      </motion.div>
    )
  }
)

ModernTestimonial.displayName = "ModernTestimonial"

export { ModernTestimonial }
