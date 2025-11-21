import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { startAutoSync } from './services/sync'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Démarrer la synchronisation automatique
startAutoSync();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
