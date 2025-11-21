// Service de synchronisation automatique
// Synchronise toutes les données entre onglets et périodiquement

const SYNC_INTERVAL = 2000; // Synchronisation toutes les 2 secondes
const SYNC_KEYS = [
  'monDrive_files',
  'monDrive_fileContents',
  'monDrive_shareLinks',
  'monDrive_calendar',
  'monDrive_contacts',
  'monDrive_notes',
  'monDrive_tasks',
  'monDrive_boards',
  'monDrive_activities',
  'monDrive_notifications',
  'monDrive_chats',
  'monDrive_messages',
];

let syncInterval: ReturnType<typeof setInterval> | null = null;
let lastSyncTimestamp = Date.now();

// Démarrer la synchronisation automatique
export const startAutoSync = () => {
  if (syncInterval) return; // Déjà démarré

  // Synchronisation initiale
  syncAll();

  // Synchronisation périodique
  syncInterval = setInterval(() => {
    syncAll();
  }, SYNC_INTERVAL);

  // Écouter les changements de localStorage depuis d'autres onglets
  window.addEventListener('storage', handleStorageChange);

  // Écouter les événements personnalisés de synchronisation
  window.addEventListener('syncRequest', handleSyncRequest);
};

// Arrêter la synchronisation automatique
export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  window.removeEventListener('storage', handleStorageChange);
  window.removeEventListener('syncRequest', handleSyncRequest);
};

// Gérer les changements de localStorage depuis d'autres onglets
const handleStorageChange = (e: StorageEvent) => {
  if (e.key && SYNC_KEYS.some(key => e.key?.startsWith(key))) {
    // Déclencher une synchronisation pour cette clé spécifique
    syncKey(e.key);
  }
};

// Gérer les demandes de synchronisation
const handleSyncRequest = (e: Event) => {
  const customEvent = e as CustomEvent;
  const key = customEvent.detail?.key;
  if (key) {
    syncKey(key);
  } else {
    syncAll();
  }
};

// Synchroniser une clé spécifique
const syncKey = (key: string) => {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      // Déclencher un événement pour notifier les composants
      window.dispatchEvent(new CustomEvent('dataSynced', {
        detail: { key, value: JSON.parse(value) }
      }));
    }
  } catch (error) {
    console.error(`Erreur lors de la synchronisation de ${key}:`, error);
  }
};

// Synchroniser toutes les données
const syncAll = () => {
  const currentTimestamp = Date.now();
  
  SYNC_KEYS.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Déclencher un événement de synchronisation
        window.dispatchEvent(new CustomEvent('dataSynced', {
          detail: { key, value: JSON.parse(value), timestamp: currentTimestamp }
        }));
      }
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${key}:`, error);
    }
  });

  // Synchroniser aussi les clés dynamiques (fichiers individuels, messages, etc.)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('monDrive_fileContent_') ||
      key.startsWith('monDrive_messages_') ||
      key.startsWith('monDrive_collaborators_')
    )) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          window.dispatchEvent(new CustomEvent('dataSynced', {
            detail: { key, value, timestamp: currentTimestamp }
          }));
        }
      } catch (error) {
        console.error(`Erreur lors de la synchronisation de ${key}:`, error);
      }
    }
  }

  lastSyncTimestamp = currentTimestamp;
  
  // Déclencher un événement global de synchronisation
  window.dispatchEvent(new CustomEvent('syncCompleted', {
    detail: { timestamp: currentTimestamp }
  }));
};

// Forcer une synchronisation immédiate
export const forceSync = () => {
  syncAll();
};

// Obtenir le timestamp de la dernière synchronisation
export const getLastSyncTimestamp = () => lastSyncTimestamp;

// Vérifier si la synchronisation est active
export const isSyncActive = () => syncInterval !== null;

