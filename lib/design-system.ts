/**
 * Futurystyczny Design System - Kolory i Theme
 * 
 * Gradient theme z glassmorphism effects
 * Cyberpunk-inspired colors z accessibility
 */

export const colors = {
  // Primary gradients - futurystyczne gradienty
  gradient: {
    primary: 'from-violet-600 via-purple-600 to-indigo-600',
    success: 'from-emerald-500 via-green-500 to-teal-500',
    warning: 'from-amber-500 via-orange-500 to-red-500',
    danger: 'from-rose-600 via-pink-600 to-purple-600',
    info: 'from-cyan-500 via-blue-500 to-indigo-500',
    dark: 'from-slate-800 via-gray-900 to-black',
  },

  // Role-specific colors
  role: {
    employee: {
      primary: 'from-blue-500 to-cyan-500',
      bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      text: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800',
    },
    manager: {
      primary: 'from-purple-500 to-pink-500',
      bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800',
    },
    owner: {
      primary: 'from-orange-500 to-red-500',
      bg: 'bg-gradient-to-br from-orange-50 to-red-50',
      text: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-800',
    },
    admin: {
      primary: 'from-red-600 to-rose-600',
      bg: 'bg-gradient-to-br from-red-50 to-rose-50',
      text: 'text-red-600',
      badge: 'bg-red-100 text-red-800',
    },
  },

  // Glassmorphism
  glass: {
    light: 'bg-white/70 backdrop-blur-xl border border-white/20',
    dark: 'bg-gray-900/70 backdrop-blur-xl border border-white/10',
    primary: 'bg-violet-500/10 backdrop-blur-xl border border-violet-500/20',
  },

  // Neon accents (cyberpunk style)
  neon: {
    cyan: 'shadow-[0_0_30px_rgba(6,182,212,0.5)]',
    purple: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
    pink: 'shadow-[0_0_30px_rgba(236,72,153,0.5)]',
    green: 'shadow-[0_0_30px_rgba(34,197,94,0.5)]',
  },
}

export const animations = {
  // Entrance animations
  fadeIn: 'animate-[fadeIn_0.5s_ease-out]',
  slideUp: 'animate-[slideUp_0.5s_ease-out]',
  slideDown: 'animate-[slideDown_0.5s_ease-out]',
  scaleIn: 'animate-[scaleIn_0.3s_ease-out]',

  // Interactive
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',

  // Hover effects
  hoverScale: 'transition-transform hover:scale-105',
  hoverGlow: 'transition-all hover:shadow-2xl',
  hoverLift: 'transition-all hover:-translate-y-1 hover:shadow-lg',
}

export const spacing = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12 md:py-16 lg:py-20',
  card: 'p-6 md:p-8',
}

export const typography = {
  h1: 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight',
  h2: 'text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight',
  h3: 'text-2xl md:text-3xl font-semibold',
  h4: 'text-xl md:text-2xl font-semibold',
  body: 'text-base md:text-lg',
  small: 'text-sm md:text-base',
}
