import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { Menu, X, ChefHat, User, Truck, Home, Search, Heart, ShoppingCart } from "lucide-react"

interface ModernNavProps {
  onSignInClick: () => void
  onSignUpClick: () => void
  variant?: "default" | "glass" | "solid"
  className?: string
}

export const ModernNav = React.forwardRef<HTMLElement, ModernNavProps>(
  ({ onSignInClick, onSignUpClick, variant = "glass", className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 20)
      }
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navVariants = {
      default: "bg-white/80 backdrop-blur-xl border-b border-white/20",
      glass: "bg-white/60 backdrop-blur-md border-b border-white/30",
      solid: "bg-white border-b border-gray-200 shadow-sm"
    }

    const navItems = [
      { label: "Inicio", href: "/", icon: Home },
      { label: "Platos", href: "/dishes", icon: Search },
      { label: "Cocineros", href: "/cooks", icon: ChefHat },
      { label: "Favoritos", href: "/favorites", icon: Heart },
    ]

    return (
      <>
        <motion.nav
          ref={ref}
          className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
            navVariants[variant],
            isScrolled && "shadow-lg",
            className
          )}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-moai-500 to-pacific-500 flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-moai-600" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-moai-600 to-pacific-600 bg-clip-text text-transparent">
                  <span className="text-xl font-bold text-moai-700">Moai</span>
                </span>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                {navItems.map((item) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    className="flex items-center space-x-2 text-gray-700 hover:text-moai-600 transition-colors duration-200 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.a>
                ))}
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={onSignInClick}
                  className="text-gray-700 hover:text-moai-600 hover:bg-moai-50"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  onClick={onSignUpClick}
                  variant="default"
                  className="bg-white text-moai-700 border border-moai-200 hover:bg-moai-50 hover:text-moai-900 shadow hover:shadow-md"
                >
                  Registrarse
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </motion.nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />

              {/* Menu Panel */}
              <motion.div
                className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
              >
                <div className="p-6">
                  {/* Mobile Logo */}
                  <div className="flex items-center space-x-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-moai-500 to-pacific-500 flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-moai-600" />
                    </div>
                    <span className="text-lg font-bold text-moai-700">Moai</span>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="space-y-4 mb-8">
                    {navItems.map((item, index) => (
                      <motion.a
                        key={item.label}
                        href={item.href}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-moai-50 transition-colors"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className="w-5 h-5 text-moai-600" />
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </motion.a>
                    ))}
                  </div>

                  {/* Mobile Auth Buttons */}
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        onSignInClick()
                        setIsOpen(false)
                      }}
                      className="w-full justify-center"
                    >
                      Iniciar Sesión
                    </Button>
                    <Button
                      onClick={() => {
                        onSignUpClick()
                        setIsOpen(false)
                      }}
                      className="w-full justify-center bg-white text-moai-700 border border-moai-200 hover:bg-moai-50 hover:text-moai-900 shadow hover:shadow-md"
                    >
                      Registrarse
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }
)

ModernNav.displayName = "ModernNav"
