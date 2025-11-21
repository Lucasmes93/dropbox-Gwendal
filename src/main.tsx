import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { startAutoSync } from './services/sync'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Gestion globale des erreurs non capturées
window.addEventListener('error', (event) => {
  console.error('Erreur globale:', event.error);
  // Ne pas empêcher le comportement par défaut pour les erreurs critiques
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesse rejetée non gérée:', event.reason);
  // Empêcher le comportement par défaut (affichage dans la console)
  event.preventDefault();
});

// Démarrer la synchronisation automatique avec gestion d'erreur
try {
  startAutoSync();
} catch (error) {
  console.error('Erreur lors du démarrage de la synchronisation:', error);
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
