// Service de synchronisation automatique
// Synchronise toutes les données entre onglets et périodiquement

const SYNC_INTERVAL = 5000; // Synchronisation toutes les 5 secondes (réduit pour éviter les blocages)
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
let isSyncing = false; // Éviter les synchronisations simultanées
let lastSyncValues: Record<string, string> = {}; // Cache des dernières valeurs pour éviter les synchronisations inutiles

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
  // Éviter les synchronisations simultanées
  if (isSyncing) {
    return;
  }

  try {
    isSyncing = true;
    const currentTimestamp = Date.now();
    let hasChanges = false;
    
    SYNC_KEYS.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        // Ne synchroniser que si la valeur a changé
        if (value && value !== lastSyncValues[key]) {
          try {
            const parsed = JSON.parse(value);
            // Déclencher un événement de synchronisation uniquement si la valeur a changé
            window.dispatchEvent(new CustomEvent('dataSynced', {
              detail: { key, value: parsed, timestamp: currentTimestamp }
            }));
            lastSyncValues[key] = value;
            hasChanges = true;
          } catch (parseError) {
            console.error(`Erreur lors du parsing de ${key}:`, parseError);
            // Ne pas bloquer la synchronisation pour une clé invalide
          }
        } else if (!value && lastSyncValues[key]) {
          // La clé a été supprimée
          lastSyncValues[key] = '';
          hasChanges = true;
        }
      } catch (error) {
        console.error(`Erreur lors de la synchronisation de ${key}:`, error);
        // Continuer avec les autres clés
      }
    });

    // Ne synchroniser les clés dynamiques que si nécessaire (réduire la charge)
    // Limiter drastiquement pour éviter les problèmes de performance
    try {
      const maxKeys = 50; // Réduit de 1000 à 50 pour éviter les blocages
      let keyCount = 0;
      
      for (let i = 0; i < localStorage.length && keyCount < maxKeys; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('monDrive_fileContent_') ||
          key.startsWith('monDrive_messages_') ||
          key.startsWith('monDrive_collaborators_')
        )) {
          try {
            const value = localStorage.getItem(key);
            // Ne synchroniser que si la valeur a changé
            if (value && value !== lastSyncValues[key]) {
              window.dispatchEvent(new CustomEvent('dataSynced', {
                detail: { key, value, timestamp: currentTimestamp }
              }));
              lastSyncValues[key] = value;
              hasChanges = true;
              keyCount++;
            }
          } catch (error) {
            console.error(`Erreur lors de la synchronisation de ${key}:`, error);
            // Continuer avec les autres clés
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation des clés dynamiques:', error);
    }

    lastSyncTimestamp = currentTimestamp;
    
    // Déclencher un événement global de synchronisation uniquement s'il y a eu des changements
    if (hasChanges) {
      window.dispatchEvent(new CustomEvent('syncCompleted', {
        detail: { timestamp: currentTimestamp }
      }));
    }
  } catch (error) {
    console.error('Erreur critique lors de la synchronisation:', error);
    // Ne pas propager l'erreur pour éviter de casser l'application
  } finally {
    isSyncing = false;
  }
};

// Forcer une synchronisation immédiate
export const forceSync = () => {
  syncAll();
};

// Obtenir le timestamp de la dernière synchronisation
export const getLastSyncTimestamp = () => lastSyncTimestamp;

// Vérifier si la synchronisation est active
export const isSyncActive = () => syncInterval !== null;

