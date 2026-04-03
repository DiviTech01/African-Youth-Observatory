import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // AYD Brand Color Palette
        'ayd': {
          green: 'hsl(var(--ayd-green))',
          gold: 'hsl(var(--ayd-gold))',
          blue: 'hsl(var(--ayd-blue))',
          red: 'hsl(var(--ayd-red))',
        },
        // Pan-African color palette
        'pan-green': {
          50: 'hsl(138 76% 97%)',
          100: 'hsl(141 79% 90%)',
          200: 'hsl(141 78% 80%)',
          300: 'hsl(142 76% 66%)',
          400: 'hsl(142 72% 52%)',
          500: 'hsl(142 71% 45%)',
          600: 'hsl(142 76% 36%)',
          700: 'hsl(142 72% 29%)',
          800: 'hsl(143 70% 24%)',
          900: 'hsl(144 69% 20%)',
        },
        'pan-gold': {
          50: 'hsl(48 100% 96%)',
          100: 'hsl(45 100% 89%)',
          200: 'hsl(41 100% 78%)',
          300: 'hsl(38 100% 65%)',
          400: 'hsl(36 100% 55%)',
          500: 'hsl(36 100% 50%)',
          600: 'hsl(32 100% 45%)',
          700: 'hsl(26 97% 38%)',
          800: 'hsl(23 92% 32%)',
          900: 'hsl(21 86% 27%)',
        },
        'pan-blue': {
          50: 'hsl(204 100% 97%)',
          100: 'hsl(204 94% 90%)',
          200: 'hsl(201 94% 80%)',
          300: 'hsl(199 93% 67%)',
          400: 'hsl(199 89% 52%)',
          500: 'hsl(199 89% 48%)',
          600: 'hsl(200 97% 39%)',
          700: 'hsl(201 96% 32%)',
          800: 'hsl(201 90% 27%)',
          900: 'hsl(202 80% 24%)',
        },
        'pan-red': {
          50: 'hsl(0 86% 97%)',
          100: 'hsl(0 93% 94%)',
          200: 'hsl(0 96% 89%)',
          300: 'hsl(0 94% 82%)',
          400: 'hsl(0 90% 71%)',
          500: 'hsl(0 84% 60%)',
          600: 'hsl(0 72% 51%)',
          700: 'hsl(0 74% 42%)',
          800: 'hsl(0 70% 35%)',
          900: 'hsl(0 63% 31%)',
        },
        'chart': {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'pulse-gentle': 'pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up': 'count-up 0.6s ease-out',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
