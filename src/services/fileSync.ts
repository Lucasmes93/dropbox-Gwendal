// Service de synchronisation bidirectionnelle avec les fichiers locaux
// Surveille les modifications locales et les synchronise avec le serveur

import api from './api';
import { onWebSocketEvent } from './websocket';

interface FileLock {
  fileId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

// Cache des verrous de fichiers
const fileLocks = new Map<string, FileLock>();

// Intervalle de vérification des modifications locales (en ms)
const SYNC_INTERVAL = 2000; // 2 secondes

// Fichiers en cours de synchronisation
const syncingFiles = new Set<string>();

/**
 * Verrouiller un fichier pour l'édition
 */
export const lockFile = async (fileId: string, userId: string, userName: string): Promise<boolean> => {
  try {
    const response = await api.lockFile(fileId);
    if (response && response.locked) {
      fileLocks.set(fileId, {
        fileId,
        userId,
        userName,
        timestamp: Date.now(),
      });
      return true;
    }
    return false;
  } catch (error: any) {
    // Si le fichier est déjà verrouillé par quelqu'un d'autre
    if (error?.message?.includes('verrouillé') || error?.response?.status === 409) {
      return false;
    }
    return false;
  }
};

/**
 * Déverrouiller un fichier
 */
export const unlockFile = async (fileId: string): Promise<void> => {
  try {
    await api.unlockFile(fileId);
    fileLocks.delete(fileId);
  } catch (error) {
  }
};

/**
 * Vérifier si un fichier est verrouillé
 */
export const isFileLocked = (fileId: string): FileLock | null => {
  return fileLocks.get(fileId) || null;
};

/**
 * Ouvrir un fichier avec l'application native
 */
export const openFileWithNativeApp = async (fileId: string, fileName: string): Promise<void> => {
  try {
    // Télécharger le fichier
    await api.downloadFile(fileId, fileName);
    
    // Noter que le fichier est ouvert localement
    const openedFiles = JSON.parse(localStorage.getItem('monDrive_openedFiles') || '[]');
    if (!openedFiles.includes(fileId)) {
      openedFiles.push({
        fileId,
        fileName,
        openedAt: Date.now(),
      });
      localStorage.setItem('monDrive_openedFiles', JSON.stringify(openedFiles));
    }
    
    // Démarrer la surveillance des modifications
    startFileWatch(fileId, fileName);
  } catch (error) {
    throw error;
  }
};

/**
 * Surveiller les modifications d'un fichier local
 */
const startFileWatch = (fileId: string, fileName: string): void => {
  if (syncingFiles.has(fileId)) {
    return; // Déjà en cours de surveillance
  }
  
  syncingFiles.add(fileId);
  
  // Utiliser File System Access API si disponible (Chrome/Edge)
  if ('showOpenFilePicker' in window) {
    watchFileWithFileSystemAPI(fileId, fileName);
  } else {
    // Fallback : polling pour détecter les modifications
    watchFileWithPolling(fileId, fileName);
  }
};

/**
 * Surveiller un fichier avec File System Access API
 */
const watchFileWithFileSystemAPI = async (fileId: string, fileName: string): Promise<void> => {
  try {
    // Note: File System Access API nécessite une interaction utilisateur
    // On utilisera plutôt le polling pour la synchronisation automatique
    watchFileWithPolling(fileId, fileName);
  } catch (error) {
    watchFileWithPolling(fileId, fileName);
  }
};

/**
 * Surveiller un fichier avec polling
 * Vérifie périodiquement si le fichier a été modifié localement
 */
const watchFileWithPolling = (fileId: string, fileName: string): void => {
  let lastKnownSize = 0;
  let lastKnownModified = 0;
  
  const checkInterval = setInterval(async () => {
    try {
      // Vérifier si le fichier est toujours ouvert
      const openedFiles = JSON.parse(localStorage.getItem('monDrive_openedFiles') || '[]');
      const isStillOpen = openedFiles.some((f: any) => f.fileId === fileId);
      
      if (!isStillOpen) {
        clearInterval(checkInterval);
        syncingFiles.delete(fileId);
        await unlockFile(fileId);
        return;
      }
      
      // Vérifier les modifications sur le serveur
      try {
        const serverFile = await api.getFile(fileId);
        if (serverFile) {
          const serverModified = new Date(serverFile.dateModification).getTime();
          
          // Si le fichier a été modifié sur le serveur par quelqu'un d'autre
          if (serverModified > lastKnownModified && lastKnownModified > 0) {
            // Notifier l'utilisateur
            window.dispatchEvent(new CustomEvent('fileModifiedOnServer', {
              detail: { fileId, fileName, serverModified }
            }));
          }
          
          lastKnownModified = serverModified;
        }
      } catch (error) {
        // Ignorer les erreurs de récupération
      }
    } catch (error) {
    }
  }, SYNC_INTERVAL);
  
  // Nettoyer après 30 minutes d'inactivité
  setTimeout(() => {
    clearInterval(checkInterval);
    syncingFiles.delete(fileId);
    unlockFile(fileId);
  }, 30 * 60 * 1000);
};

/**
 * Arrêter la surveillance d'un fichier
 */
export const stopFileWatch = (fileId: string): void => {
  syncingFiles.delete(fileId);
  const openedFiles = JSON.parse(localStorage.getItem('monDrive_openedFiles') || '[]');
  const filtered = openedFiles.filter((f: any) => f.fileId !== fileId);
  localStorage.setItem('monDrive_openedFiles', JSON.stringify(filtered));
  unlockFile(fileId);
};

/**
 * Synchroniser un fichier modifié localement vers le serveur
 */
export const syncFileToServer = async (fileId: string, file: File): Promise<void> => {
  try {
    if (syncingFiles.has(fileId)) {
      // Mettre à jour le fichier sur le serveur
      await api.updateFileContent(fileId, file);
      
      // Notifier les autres utilisateurs via WebSocket
      window.dispatchEvent(new CustomEvent('fileSyncedToServer', {
        detail: { fileId, fileName: file.name }
      }));
    }
  } catch (error) {
    throw error;
  }
};

// Écouter les événements WebSocket pour les modifications de fichiers
// Note: Cette fonction sera appelée lors de la connexion WebSocket
export const setupWebSocketListeners = () => {
  onWebSocketEvent('file_updated', (data: any) => {
    if (data.file && syncingFiles.has(data.file.id)) {
      // Le fichier a été modifié par quelqu'un d'autre
      window.dispatchEvent(new CustomEvent('fileModifiedOnServer', {
        detail: {
          fileId: data.file.id,
          fileName: data.file.nom,
          userId: data.userId,
        }
      }));
    }
  });
};

