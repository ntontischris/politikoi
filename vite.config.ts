import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Remove console statements in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React libraries
          'react-vendor': ['react', 'react-dom'],
          // Router
          'router': ['react-router-dom'],
          // Charts library
          'charts': ['recharts'],
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          // State management
          'state': ['zustand'],
          // Icons
          'icons': ['lucide-react']
        }
      }
    },
    // Increase chunk size warning limit to 1000kb since we're splitting properly
    chunkSizeWarningLimit: 1000
  }
})
