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
    // Custom responsive utilities for consistent mobile-first design
    function({ addUtilities }) {
      const newUtilities = {
        // Touch-friendly minimum size for mobile interactions
        '.touch-target': {
          'min-height': '44px', // iOS Human Interface Guidelines
          'min-width': '44px',
          'padding': '8px',
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
        // Responsive padding utility
        '.responsive-padding': {
          'padding': '12px',
          '@media (min-width: 640px)': {
            'padding': '16px',
          },
          '@media (min-width: 1024px)': {
            'padding': '24px',
          },
        },
        // Responsive modal sizing for optimal viewing
        '.responsive-modal': {
          'width': '100%',
          'max-width': '20rem', // 320px - small forms
          '@media (min-width: 640px)': {
            'max-width': '28rem', // 448px
          },
          '@media (min-width: 768px)': {
            'max-width': '32rem', // 512px
          },
          '@media (min-width: 1024px)': {
            'max-width': '48rem', // 768px
          },
        },
        '.responsive-modal-lg': {
          'width': '100%',
          'max-width': '90vw', // Almost full width on mobile
          '@media (min-width: 640px)': {
            'max-width': '32rem', // 512px
          },
          '@media (min-width: 768px)': {
            'max-width': '40rem', // 640px
          },
          '@media (min-width: 1024px)': {
            'max-width': '56rem', // 896px - large content modals
          },
        },
      }
      addUtilities(newUtilities, ['responsive'])
    },
  ],
}