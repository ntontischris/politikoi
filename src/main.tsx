import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppWrapper } from './components/AppWrapper'

// Import validation for development
if (import.meta.env.DEV) {
  import('./utils/validateSetup')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
)
