import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SoundProvider } from './audio/SoundContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SoundProvider>
      <App />
    </SoundProvider>
  </StrictMode>,
)
