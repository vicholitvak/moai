import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores originales (mantenidos para compatibilidad)
        "moai-orange": "#FF6600",
        "moai-beige": "#F5F5DC",
        
        // Paleta principal MOAI - Inspirada en Rapa Nui y Chile
        "moai": {
          50: "#FFF8F0",   // Muy claro
          100: "#FFEDD5",  // Claro
          200: "#FED7AA",  // Medio claro
          300: "#FDBA74",  // Medio
          400: "#FB923C",  // Principal claro
          500: "#F97316",  // Principal (naranja vibrante)
          600: "#EA580C",  // Principal oscuro
          700: "#C2410C",  // Oscuro
          800: "#9A3412",  // Muy oscuro
          900: "#7C2D12",  // Extra oscuro
          950: "#431407",  // Negro
        },
        
        // Colores de acento - Rapa Nui inspired
        "pacific": {
          50: "#F0F9FF",
          100: "#E0F2FE", 
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",  // Azul océano Pacífico
          600: "#0284C7",
          700: "#0369A1",
          800: "#075985",
          900: "#0C4A6E",
        },
        
        // Tierra y naturaleza chilena
        "andes": {
          50: "#FAFAF9",
          100: "#F4F4F3",
          200: "#E5E5E2",
          300: "#D1D0CC",
          400: "#B8B6B0",
          500: "#8B7355",  // Marrón montaña
          600: "#6B5B42",
          700: "#544536",
          800: "#44362A",
          900: "#362B20",
        },
        
        // Verde natural chileno
        "quillay": {
          50: "#F7FDF7",
          100: "#F1FCF1",
          200: "#E3F9E3",
          300: "#D4F4D4",
          400: "#A3E6A3",
          500: "#65C365",  // Verde natural
          600: "#4A9F4A",
          700: "#3A7C3A",
          800: "#2D5F2D",
          900: "#1F451F",
        },
        
        // Paleta Desierto de Atacama (mantenida)
        "atacama-orange": "#F57C00",     
        "atacama-brown": "#8D6E63",      
        "atacama-beige": "#D7CCC8",      
        "atacama-olive": "#556B2F",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        "ring-offset-background": "hsl(var(--ring-offset-background))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        "hero-banner": "url('/valleluna.jpg')",
        "gradient-moai": "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
        "gradient-pacific": "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
        "gradient-andes": "linear-gradient(135deg, #8B7355 0%, #6B5B42 100%)",
        "gradient-sunset": "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)",
      },
      boxShadow: {
        "moai-card": "0 4px 20px -2px rgba(249, 115, 22, 0.1), 0 2px 8px -2px rgba(249, 115, 22, 0.06)",
        "pacific-card": "0 4px 20px -2px rgba(14, 165, 233, 0.1), 0 2px 8px -2px rgba(14, 165, 233, 0.06)",
        "hover-lift": "0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "bounce-gentle": "bounceGentle 2s infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;