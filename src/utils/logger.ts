/**
 * Production-ready logging utility
 * Only logs errors in production, full logging in development
 */

const isDev = import.meta.env.DEV

export const logger = {
  info: (...args: any[]) => {
    if (isDev) {
      console.log('[INFO]', ...args)
    }
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn('[WARN]', ...args)
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error('[ERROR]', ...args)
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  }
}

// Export for backwards compatibility
export const log = logger
