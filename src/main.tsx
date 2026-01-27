import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import font as URL - Vite will handle bundling
import neutrafaceFont from './assets/fonts/Neutraface_2.ttf'

// Dynamically inject @font-face
const fontStyle = document.createElement('style')
fontStyle.textContent = `
  @font-face {
    font-family: 'Neutraface 2 Display';
    src: url('${neutrafaceFont}') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Neutraface 2 Display';
    src: url('${neutrafaceFont}') format('truetype');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
  }
`
document.head.appendChild(fontStyle)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
