import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Global toaster for sonner to render toast UI */}
    <Toaster position="top-right" />
    <App />
  </StrictMode>,
)
