/**
 * Tailwind CSS Configuration for Citizen Management Dashboard
 * 
 * RESPONSIVE DESIGN STRATEGY:
 * 
 * Breakpoint System:
 * - xs:  475px  (Extra small phones)
 * - sm:  640px  (Small tablets, large phones)
 * - md:  768px  (Medium tablets)
 * - lg:  1024px (Large tablets, small laptops)
 * - xl:  1280px (Large laptops)
 * - 2xl: 1536px (Large desktops)
 * - 3xl: 1600px (Extra large desktops)
 * 
 * Mobile-First Approach:
 * All styles default to mobile, then enhanced for larger screens
 * 
 * Key Responsive Patterns:
 * 1. Touch targets: 44px minimum for mobile interactions
 * 2. Responsive padding: 12px mobile, 16px sm, 24px lg
 * 3. Text scaling: base mobile, sm for tablet, lg for desktop
 * 4. Grid layouts: 1 col mobile → 2 cols tablet → 4+ cols desktop
 * 5. Modal sizing: Full width mobile → constrained desktop
 * 
 * Testing Strategy:
 * - Test at: 320px, 375px, 768px, 1024px, 1440px
 * - Focus on touch interactions < 768px
 * - Verify readability at all breakpoints
 * - Check form usability on mobile
 * 
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Custom breakpoints for enhanced responsive control
      screens: {
        'xs': '475px',   // Extra small phones (iPhone SE)
        '3xl': '1600px', // Ultra-wide monitors
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        slate: {
          850: '#1a202c',
          950: '#0f1419',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        'gradient-blue': 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      minHeight: {
        'screen-75': '75vh',
        'screen-50': '50vh',
      },
      maxHeight: {
        'screen-75': '75vh',
        'screen-90': '90vh',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Enhanced responsive utilities for ultra-responsive mobile-first design
    function({ addUtilities, addComponents }) {
      const newUtilities = {
        // Enhanced touch targets with better accessibility
        '.touch-target': {
          'min-height': '44px', // iOS Human Interface Guidelines
          'min-width': '44px',
          'padding': '8px',
          'cursor': 'pointer',
          'user-select': 'none',
          '-webkit-tap-highlight-color': 'rgba(0, 0, 0, 0)',
        },
        '.touch-target-lg': {
          'min-height': '48px', // Even larger for primary actions
          'min-width': '48px',
          'padding': '12px',
          'cursor': 'pointer',
          'user-select': 'none',
          '-webkit-tap-highlight-color': 'rgba(0, 0, 0, 0)',
        },

        // Responsive visibility utilities for dual-view patterns
        '.mobile-table-hidden': {
          '@media (max-width: 767px)': {
            'display': 'none',
          },
        },
        '.mobile-card-only': {
          '@media (min-width: 768px)': {
            'display': 'none',
          },
        },
        '.tablet-hidden': {
          '@media (min-width: 640px) and (max-width: 1023px)': {
            'display': 'none',
          },
        },
        '.desktop-only': {
          '@media (max-width: 1023px)': {
            'display': 'none',
          },
        },

        // Fluid spacing system using clamp()
        '.space-fluid-xs': { 'margin': 'clamp(0.25rem, 1vw, 0.5rem)' },
        '.space-fluid-sm': { 'margin': 'clamp(0.5rem, 2vw, 1rem)' },
        '.space-fluid-md': { 'margin': 'clamp(1rem, 3vw, 1.5rem)' },
        '.space-fluid-lg': { 'margin': 'clamp(1.5rem, 4vw, 2.5rem)' },
        '.space-fluid-xl': { 'margin': 'clamp(2rem, 6vw, 4rem)' },

        // Responsive padding with better mobile optimization
        '.responsive-padding': {
          'padding': '12px',
          '@media (min-width: 640px)': {
            'padding': '16px',
          },
          '@media (min-width: 1024px)': {
            'padding': '24px',
          },
        },
        '.responsive-padding-x': {
          'padding-left': '12px',
          'padding-right': '12px',
          '@media (min-width: 640px)': {
            'padding-left': '16px',
            'padding-right': '16px',
          },
          '@media (min-width: 1024px)': {
            'padding-left': '24px',
            'padding-right': '24px',
          },
        },
        '.responsive-padding-y': {
          'padding-top': '12px',
          'padding-bottom': '12px',
          '@media (min-width: 640px)': {
            'padding-top': '16px',
            'padding-bottom': '16px',
          },
          '@media (min-width: 1024px)': {
            'padding-top': '24px',
            'padding-bottom': '24px',
          },
        },

        // Enhanced modal sizing with fullscreen mobile mode
        '.responsive-modal': {
          'width': '100%',
          'max-width': '100vw',
          'max-height': '100vh',
          'margin': '0',
          'border-radius': '0',
          '@media (min-width: 640px)': {
            'max-width': '28rem',
            'max-height': '90vh',
            'margin': 'auto',
            'border-radius': '0.75rem',
          },
          '@media (min-width: 768px)': {
            'max-width': '32rem',
          },
          '@media (min-width: 1024px)': {
            'max-width': '48rem',
          },
        },
        '.responsive-modal-lg': {
          'width': '100%',
          'max-width': '100vw',
          'max-height': '100vh',
          'margin': '0',
          'border-radius': '0',
          '@media (min-width: 640px)': {
            'max-width': '32rem',
            'max-height': '90vh',
            'margin': 'auto',
            'border-radius': '0.75rem',
          },
          '@media (min-width: 768px)': {
            'max-width': '40rem',
          },
          '@media (min-width: 1024px)': {
            'max-width': '56rem',
          },
        },
        '.responsive-modal-xl': {
          'width': '100%',
          'max-width': '100vw',
          'max-height': '100vh',
          'margin': '0',
          'border-radius': '0',
          '@media (min-width: 640px)': {
            'max-width': '48rem',
            'max-height': '90vh',
            'margin': 'auto',
            'border-radius': '0.75rem',
          },
          '@media (min-width: 1024px)': {
            'max-width': '64rem',
          },
          '@media (min-width: 1280px)': {
            'max-width': '80rem',
          },
        },

        // Responsive text sizing with fluid typography
        '.text-fluid-xs': { 'font-size': 'clamp(0.75rem, 2vw, 0.875rem)' },
        '.text-fluid-sm': { 'font-size': 'clamp(0.875rem, 2.5vw, 1rem)' },
        '.text-fluid-base': { 'font-size': 'clamp(1rem, 3vw, 1.125rem)' },
        '.text-fluid-lg': { 'font-size': 'clamp(1.125rem, 3.5vw, 1.25rem)' },
        '.text-fluid-xl': { 'font-size': 'clamp(1.25rem, 4vw, 1.5rem)' },
        '.text-fluid-2xl': { 'font-size': 'clamp(1.5rem, 5vw, 2rem)' },
        '.text-fluid-3xl': { 'font-size': 'clamp(1.875rem, 6vw, 2.5rem)' },

        // Safe area utilities for notched devices
        '.safe-top': { 'padding-top': 'env(safe-area-inset-top)' },
        '.safe-bottom': { 'padding-bottom': 'env(safe-area-inset-bottom)' },
        '.safe-left': { 'padding-left': 'env(safe-area-inset-left)' },
        '.safe-right': { 'padding-right': 'env(safe-area-inset-right)' },
        '.safe-x': {
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)'
        },
        '.safe-y': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)'
        },

        // Scroll utilities
        '.scroll-smooth-mobile': {
          'scroll-behavior': 'smooth',
          '-webkit-overflow-scrolling': 'touch',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            'display': 'none',
          },
        },

        // Container with max-width and padding
        '.container-responsive': {
          'width': '100%',
          'padding-left': '1rem',
          'padding-right': '1rem',
          '@media (min-width: 640px)': {
            'padding-left': '1.5rem',
            'padding-right': '1.5rem',
          },
          '@media (min-width: 1024px)': {
            'padding-left': '2rem',
            'padding-right': '2rem',
            'max-width': '1200px',
            'margin-left': 'auto',
            'margin-right': 'auto',
          },
        },

        // Responsive grid utilities
        '.grid-responsive': {
          'display': 'grid',
          'grid-template-columns': '1fr',
          'gap': '1rem',
          '@media (min-width: 640px)': {
            'grid-template-columns': 'repeat(2, 1fr)',
          },
          '@media (min-width: 1024px)': {
            'grid-template-columns': 'repeat(3, 1fr)',
          },
        },
        '.grid-responsive-4': {
          'display': 'grid',
          'grid-template-columns': '1fr',
          'gap': '1rem',
          '@media (min-width: 640px)': {
            'grid-template-columns': 'repeat(2, 1fr)',
          },
          '@media (min-width: 1024px)': {
            'grid-template-columns': 'repeat(4, 1fr)',
          },
        },
        '.grid-auto-fit': {
          'display': 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(250px, 1fr))',
          'gap': '1rem',
        },
        '.grid-auto-fill': {
          'display': 'grid',
          'grid-template-columns': 'repeat(auto-fill, minmax(200px, 1fr))',
          'gap': '1rem',
        },

        // Enhanced table utilities
        '.table-responsive': {
          'overflow-x': 'auto',
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            'height': '4px',
          },
          '&::-webkit-scrollbar-track': {
            'background': '#1f2937',
          },
          '&::-webkit-scrollbar-thumb': {
            'background': '#4b5563',
            'border-radius': '2px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            'background': '#6b7280',
          },
        },
      }

      // Component-level responsive utilities
      const components = {
        '.btn-responsive': {
          'padding': '0.5rem 1rem',
          'font-size': '0.875rem',
          '@media (min-width: 640px)': {
            'padding': '0.75rem 1.5rem',
            'font-size': '1rem',
          },
        },
        '.card-responsive': {
          'padding': '1rem',
          'border-radius': '0.5rem',
          '@media (min-width: 640px)': {
            'padding': '1.5rem',
            'border-radius': '0.75rem',
          },
          '@media (min-width: 1024px)': {
            'padding': '2rem',
            'border-radius': '1rem',
          },
        },
      }

      addUtilities(newUtilities, ['responsive'])
      addComponents(components)
    },
  ],
}