import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'  // Font CSS - Vite processes at build time
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
