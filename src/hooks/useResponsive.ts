import { useState, useEffect, useCallback } from 'react'

// Breakpoint definitions matching Tailwind config
const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1600
} as const

export type Breakpoint = keyof typeof breakpoints

// Hook for responsive breakpoint detection
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<{
    width: number
    height: number
  }>(() => {
    // Safe default values for SSR
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 }
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  })

  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'lg'

    const width = window.innerWidth
    if (width >= breakpoints['3xl']) return '3xl'
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    if (width >= breakpoints.xs) return 'xs'
    return 'xs'
  })

  const updateSize = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight

    setScreenSize({ width, height })

    // Determine current breakpoint
    let newBreakpoint: Breakpoint = 'xs'
    if (width >= breakpoints['3xl']) newBreakpoint = '3xl'
    else if (width >= breakpoints['2xl']) newBreakpoint = '2xl'
    else if (width >= breakpoints.xl) newBreakpoint = 'xl'
    else if (width >= breakpoints.lg) newBreakpoint = 'lg'
    else if (width >= breakpoints.md) newBreakpoint = 'md'
    else if (width >= breakpoints.sm) newBreakpoint = 'sm'
    else if (width >= breakpoints.xs) newBreakpoint = 'xs'

    setCurrentBreakpoint(newBreakpoint)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    updateSize() // Set initial size

    const handleResize = () => {
      // Debounce resize events for better performance
      const timeoutId = setTimeout(updateSize, 100)
      return () => clearTimeout(timeoutId)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [updateSize])

  // Utility functions
  const isBreakpoint = useCallback((breakpoint: Breakpoint) => {
    return screenSize.width >= breakpoints[breakpoint]
  }, [screenSize.width])

  const isMobile = screenSize.width < breakpoints.md
  const isTablet = screenSize.width >= breakpoints.md && screenSize.width < breakpoints.lg
  const isDesktop = screenSize.width >= breakpoints.lg
  const isLargeDesktop = screenSize.width >= breakpoints.xl

  return {
    screenSize,
    currentBreakpoint,
    isBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Additional helpful properties
    isXs: currentBreakpoint === 'xs',
    isSm: currentBreakpoint === 'sm',
    isMd: currentBreakpoint === 'md',
    isLg: currentBreakpoint === 'lg',
    isXl: currentBreakpoint === 'xl',
    is2Xl: currentBreakpoint === '2xl',
    is3Xl: currentBreakpoint === '3xl',
    // Width-based helpers
    width: screenSize.width,
    height: screenSize.height
  }
}

// Hook for device orientation detection
export function useOrientation() {
  const [orientation, setOrientation] = useState<{
    angle: number
    type: 'portrait' | 'landscape'
  }>(() => {
    if (typeof window === 'undefined') {
      return { angle: 0, type: 'portrait' }
    }

    const screen = window.screen as any
    const angle = screen.orientation?.angle || screen.mozOrientation || screen.msOrientation || 0
    const isPortrait = window.innerHeight > window.innerWidth

    return {
      angle,
      type: isPortrait ? 'portrait' : 'landscape'
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateOrientation = () => {
      const screen = window.screen as any
      const angle = screen.orientation?.angle || screen.mozOrientation || screen.msOrientation || 0
      const isPortrait = window.innerHeight > window.innerWidth

      setOrientation({
        angle,
        type: isPortrait ? 'portrait' : 'landscape'
      })
    }

    // Listen for orientation changes
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(updateOrientation, 100)
    }

    const handleResize = () => {
      updateOrientation()
    }

    // Different browsers use different events
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    // Also listen for screen.orientation change if available
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation)
    }

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleResize)
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation)
      }
    }
  }, [])

  return {
    ...orientation,
    isPortrait: orientation.type === 'portrait',
    isLandscape: orientation.type === 'landscape'
  }
}

// Hook for touch device detection
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false

    // Multiple detection methods for better accuracy
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    )
  })

  const [hasHover, setHasHover] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(hover: hover)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Update touch detection
    const touchSupported = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    )
    setIsTouchDevice(touchSupported)

    // Set up media query listeners
    const hoverMediaQuery = window.matchMedia('(hover: hover)')
    const pointerMediaQuery = window.matchMedia('(pointer: coarse)')

    const updateHoverSupport = () => {
      setHasHover(hoverMediaQuery.matches)
    }

    const updateTouchSupport = () => {
      setIsTouchDevice(pointerMediaQuery.matches || touchSupported)
    }

    // Add listeners
    hoverMediaQuery.addEventListener('change', updateHoverSupport)
    pointerMediaQuery.addEventListener('change', updateTouchSupport)

    return () => {
      hoverMediaQuery.removeEventListener('change', updateHoverSupport)
      pointerMediaQuery.removeEventListener('change', updateTouchSupport)
    }
  }, [])

  return {
    isTouchDevice,
    hasHover,
    // Convenience properties
    isMouseDevice: !isTouchDevice && hasHover,
    isMobileDevice: isTouchDevice && !hasHover,
    isHybridDevice: isTouchDevice && hasHover // Laptops with touchscreens
  }
}

// Combined hook for comprehensive responsive detection
export function useDevice() {
  const responsive = useResponsive()
  const orientation = useOrientation()
  const touch = useTouchDevice()

  // Device type detection based on multiple factors
  const deviceType = () => {
    if (responsive.isMobile && touch.isTouchDevice) return 'mobile'
    if (responsive.isTablet && touch.isTouchDevice) return 'tablet'
    if (responsive.isDesktop && !touch.isTouchDevice) return 'desktop'
    if (responsive.isDesktop && touch.isTouchDevice) return 'hybrid'
    return 'unknown'
  }

  return {
    ...responsive,
    ...orientation,
    ...touch,
    deviceType: deviceType()
  }
}

// Hook for media query matching
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)

    const handleChange = () => {
      setMatches(mediaQuery.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    // Set initial value
    setMatches(mediaQuery.matches)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}

// Hook for detecting reduced motion preference
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

// Hook for detecting user's color scheme preference
export function useColorScheme(): 'light' | 'dark' | undefined {
  const [scheme, setScheme] = useState<'light' | 'dark' | undefined>(() => {
    if (typeof window === 'undefined') return undefined

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
    return undefined
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)')

    const handleChange = () => {
      if (darkQuery.matches) setScheme('dark')
      else if (lightQuery.matches) setScheme('light')
      else setScheme(undefined)
    }

    darkQuery.addEventListener('change', handleChange)
    lightQuery.addEventListener('change', handleChange)

    return () => {
      darkQuery.removeEventListener('change', handleChange)
      lightQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return scheme
}