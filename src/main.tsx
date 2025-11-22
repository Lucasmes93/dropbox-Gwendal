import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { startAutoSync } from './services/sync'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Gestion globale des erreurs non capturées
window.addEventListener('error', (event) => {
  // Ne pas empêcher le comportement par défaut pour les erreurs critiques
});

window.addEventListener('unhandledrejection', (event) => {
  // Empêcher le comportement par défaut (affichage dans la console)
  event.preventDefault();
});

// Nettoyer toutes les données d'exemple au démarrage
try {
  // Supprimer toutes les clés localStorage qui ne sont plus utilisées
  // (maintenant tout passe par l'API backend)
  const keysToClean = [
    'monDrive_calendar',
    'monDrive_contacts',
    'monDrive_notes',
    'monDrive_tasks',
    'monDrive_boards',
    'monDrive_chats',
    'monDrive_files',
    'monDrive_recentFiles',
    'monDrive_favorites',
    'monDrive_shared',
    'monDrive_tags',
    'monDrive_activity',
    'monDrive_notifications',
  ];
  
  keysToClean.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Ignorer les erreurs
    }
  });
  
  // Garder uniquement les données essentielles
  // - monDrive_user (pour la session)
  // - monDrive_token (pour l'authentification)
} catch (error) {
  // Ignorer les erreurs de nettoyage
}

// Démarrer la synchronisation automatique avec gestion d'erreur
try {
  startAutoSync();
} catch (error) {
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
