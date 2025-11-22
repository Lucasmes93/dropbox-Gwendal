// Service de synchronisation avec un dossier local sur le disque dur
// Utilise l'API File System Access pour accéder au système de fichiers

// Déclarations de types pour l'API File System Access
declare global {
  interface Window {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
  }
  
  interface FileSystemDirectoryHandle {
    name: string;
    kind: 'directory';
    values(): AsyncIterableIterator<FileSystemHandle>;
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  }
  
  interface FileSystemFileHandle {
    name: string;
    kind: 'file';
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }
  
  interface FileSystemHandle {
    name: string;
    kind: 'file' | 'directory';
  }
  
  interface FileSystemWritableFileStream extends WritableStream {
    write(data: Blob | string): Promise<void>;
    close(): Promise<void>;
  }
}

let syncDirectoryHandle: FileSystemDirectoryHandle | null = null;
let syncSubFolderPath: string | null = null; // Chemin du sous-dossier à synchroniser (ex: "ProjetX" ou "Documents/ProjetX")
let syncInterval: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;
let lastSyncTime: number | null = null;
let syncPath: string | null = null;

// Vérifier si l'API File System Access est disponible
export const isFileSystemAccessSupported = () => {
  return 'showDirectoryPicker' in window;
};

// Sélectionner le dossier principal de l'entreprise
export const selectMainFolder = async () => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('L\'API File System Access n\'est pas supportée par votre navigateur. Utilisez Chrome, Edge ou Opera.');
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });
    
    syncDirectoryHandle = handle;
    syncPath = handle.name;
    syncSubFolderPath = null; // Réinitialiser le sous-dossier
    
    // Sauvegarder la référence du dossier dans localStorage
    localStorage.setItem('monDrive_syncFolderName', handle.name);
    localStorage.removeItem('monDrive_syncSubFolderPath');
    
    return {
      success: true,
      folderName: handle.name,
      handle: handle,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Sélection annulée' };
    }
    throw error;
  }
};

// Sélectionner un sous-dossier à synchroniser dans le dossier principal
export const selectSubFolder = async (mainHandle: FileSystemDirectoryHandle, subFolderPath: string) => {
  try {
    const pathParts = subFolderPath.split('/').filter(p => p);
    let currentDir = mainHandle;
    
    // Naviguer vers le sous-dossier
    for (const part of pathParts) {
      currentDir = await currentDir.getDirectoryHandle(part);
    }
    
    syncSubFolderPath = subFolderPath;
    localStorage.setItem('monDrive_syncSubFolderPath', subFolderPath);
    
    return {
      success: true,
      folderName: pathParts[pathParts.length - 1] || subFolderPath,
      fullPath: subFolderPath,
    };
  } catch (error) {
    return { success: false, error: `Impossible d'accéder au sous-dossier : ${error.message}` };
  }
};

// Obtenir la liste des sous-dossiers disponibles
export const listSubFolders = async (mainHandle: FileSystemDirectoryHandle): Promise<string[]> => {
  const folders: string[] = [];
  
  try {
    for await (const entry of mainHandle.values()) {
      if (entry.kind === 'directory') {
        folders.push(entry.name);
      }
    }
  } catch (error) {
    // Ignorer les erreurs
  }
  
  return folders.sort();
};

// Sélectionner un dossier de synchronisation (compatibilité avec l'ancien code)
export const selectSyncFolder = async () => {
  return await selectMainFolder();
};

// Obtenir le handle du dossier de synchronisation (demander à nouveau)
const getSyncDirectoryHandle = async (): Promise<FileSystemDirectoryHandle> => {
  if (!syncDirectoryHandle && localStorage.getItem('monDrive_syncFolderName')) {
    // L'utilisateur doit re-sélectionner le dossier à chaque fois
    // car on ne peut pas stocker le handle entre les sessions
    throw new Error('Veuillez re-sélectionner le dossier de synchronisation');
  }
  if (!syncDirectoryHandle) {
    throw new Error('Aucun dossier de synchronisation sélectionné');
  }
  
  // Si un sous-dossier est spécifié, naviguer vers ce sous-dossier
  if (syncSubFolderPath) {
    const pathParts = syncSubFolderPath.split('/').filter(p => p);
    let currentDir = syncDirectoryHandle;
    
    for (const part of pathParts) {
      currentDir = await currentDir.getDirectoryHandle(part);
    }
    
    return currentDir;
  }
  
  return syncDirectoryHandle;
};

// Lire tous les fichiers d'un dossier récursivement
const readDirectoryRecursive = async (dirHandle: FileSystemDirectoryHandle, path = ''): Promise<Array<{name: string, path: string, file: File, lastModified: number}>> => {
  const files: Array<{name: string, path: string, file: File, lastModified: number}> = [];
  
  for await (const entry of dirHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    
    if (entry.kind === 'file') {
      try {
        const file = await (entry as FileSystemFileHandle).getFile();
        files.push({
          name: entry.name,
          path: entryPath,
          file: file,
          lastModified: file.lastModified,
        });
      } catch (error) {
      }
    } else if (entry.kind === 'directory') {
      const subFiles = await readDirectoryRecursive(entry as FileSystemDirectoryHandle, entryPath);
      files.push(...subFiles);
    }
  }
  
  return files;
};

// Créer récursivement la structure de dossiers dans le backend
const ensureFolderStructure = async (pathParts: string[], existingFolders: any[]): Promise<string | null> => {
  const api = await import('./api');
  let currentParentId: string | null = null;
  
  for (let i = 0; i < pathParts.length; i++) {
    const folderName = pathParts[i];
    const fullPath = pathParts.slice(0, i + 1).join('/');
    
    // Chercher si le dossier existe déjà
    let folder = existingFolders.find(f => 
      f.nom === folderName && 
      f.type === 'dossier' &&
      f.parentId === currentParentId
    );
    
    if (!folder) {
      // Créer le dossier dans le backend
      try {
        folder = await api.api.createFolder(folderName, currentParentId);
        existingFolders.push(folder);
      } catch (error) {
        // Le dossier existe peut-être déjà, continuer
        folder = existingFolders.find(f => 
          f.nom === folderName && 
          f.type === 'dossier' &&
          f.parentId === currentParentId
        );
        if (!folder) {
          return null; // Impossible de créer le dossier
        }
      }
    }
    
    currentParentId = folder.id;
  }
  
  return currentParentId;
};

// Synchroniser les fichiers du dossier local vers l'application (backend)
export const syncFromLocalFolder = async (onProgress) => {
  if (isSyncing) {
    return { success: false, error: 'Une synchronisation est déjà en cours' };
  }

  try {
    const dirHandle = await getSyncDirectoryHandle();
    if (!dirHandle) {
      return { success: false, error: 'Aucun dossier de synchronisation sélectionné' };
    }

    isSyncing = true;
    
    // Lire tous les fichiers du dossier local
    const localFiles = await readDirectoryRecursive(dirHandle);
    
    if (onProgress) {
      onProgress({ total: localFiles.length, current: 0, status: 'Lecture des fichiers locaux...' });
    }

    // Charger les fichiers existants depuis le backend
    const api = await import('./api');
    const existingFiles = await api.api.getFiles();
    
    // Créer un index des fichiers existants par chemin local
    const filesByLocalPath = new Map();
    existingFiles.forEach(f => {
      if (f.localPath) {
        filesByLocalPath.set(f.localPath, f);
      }
    });
    
    let syncedCount = 0;
    let createdFolders = 0;

    // Pour chaque fichier local, vérifier s'il existe déjà ou le créer dans le backend
    for (let i = 0; i < localFiles.length; i++) {
      const localFile = localFiles[i];
      
      if (onProgress) {
        onProgress({ 
          total: localFiles.length, 
          current: i + 1, 
          status: `Synchronisation de ${localFile.name}...` 
        });
      }

      try {
        // Vérifier si le fichier existe déjà (par chemin local)
        const existingFile = filesByLocalPath.get(localFile.path);

        // Vérifier si le fichier a été modifié (comparer lastModified)
        const needsUpdate = !existingFile || 
          !existingFile.lastLocalSync || 
          existingFile.lastLocalSync < localFile.lastModified;

        if (needsUpdate) {
          // Déterminer le parentId en créant la structure de dossiers si nécessaire
          let parentId: string | null = null;
          
          if (localFile.path !== localFile.name) {
            // Le fichier est dans un sous-dossier
            const pathParts = localFile.path.split('/').slice(0, -1); // Exclure le nom du fichier
            if (pathParts.length > 0) {
              parentId = await ensureFolderStructure(pathParts, existingFiles);
              if (parentId) {
                createdFolders++;
              }
            }
          }

          if (existingFile) {
            // Mettre à jour le fichier existant dans le backend
            await api.api.updateFileContent(existingFile.id, localFile.file);
            
            // Mettre à jour le timestamp de synchronisation
            await api.api.updateFileMetadata(existingFile.id, {
              lastLocalSync: localFile.lastModified,
              localPath: localFile.path,
            });
          } else {
            // Créer un nouveau fichier dans le backend
            await api.api.uploadFile(localFile.file, parentId, false);
          }

          syncedCount++;
        }
      } catch (error) {
        // Continuer avec le fichier suivant en cas d'erreur
      }
    }

    lastSyncTime = Date.now();
    isSyncing = false;

    return {
      success: true,
      syncedCount,
      createdFolders,
      totalFiles: localFiles.length,
    };
  } catch (error) {
    isSyncing = false;
    return { success: false, error: error.message };
  }
};

// Synchroniser les fichiers de l'application (backend) vers le dossier local
export const syncToLocalFolder = async (onProgress) => {
  if (isSyncing) {
    return { success: false, error: 'Une synchronisation est déjà en cours' };
  }

  try {
    const dirHandle = await getSyncDirectoryHandle();
    if (!dirHandle) {
      return { success: false, error: 'Aucun dossier de synchronisation sélectionné' };
    }

    isSyncing = true;

    // Charger les fichiers depuis le backend
    const api = await import('./api');
    const allFiles = await api.api.getFiles();
    
    // Filtrer uniquement les fichiers qui ont un localPath (synchronisés depuis le local)
    // ou tous les fichiers si on veut synchroniser tout
    const appFiles = allFiles.filter(f => f.type === 'fichier' && !f.estSupprime);

    if (onProgress) {
      onProgress({ total: appFiles.length, current: 0, status: 'Téléchargement depuis le serveur...' });
    }

    let syncedCount = 0;

    // Pour chaque fichier, le télécharger et l'écrire dans le dossier local
    for (let i = 0; i < appFiles.length; i++) {
      const appFile = appFiles[i];
      
      if (onProgress) {
        onProgress({ 
          total: appFiles.length, 
          current: i + 1, 
          status: `Écriture de ${appFile.nom}...` 
        });
      }

      try {
        // Télécharger le fichier depuis le backend (obtenir le blob)
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/files/${appFile.id}/download`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          continue; // Passer au fichier suivant si erreur
        }

        const blob = await response.blob();
        
        // Déterminer le chemin du fichier
        // Si le fichier a un localPath, l'utiliser, sinon créer un chemin basé sur la structure
        let filePath: string;
        let pathParts: string[];
        
        if (appFile.localPath) {
          filePath = appFile.localPath;
          pathParts = filePath.split('/');
        } else {
          // Construire le chemin basé sur la structure de dossiers dans le backend
          const path = await buildFilePathFromBackend(appFile.id, allFiles);
          filePath = path || appFile.nom;
          pathParts = filePath.split('/');
        }

        // Créer la structure de dossiers dans le système de fichiers local
        let currentDir = dirHandle;
        for (let j = 0; j < pathParts.length - 1; j++) {
          const dirName = pathParts[j];
          try {
            currentDir = await currentDir.getDirectoryHandle(dirName, { create: true });
          } catch (error) {
            // Ignorer les erreurs et continuer
            break;
          }
        }

        // Créer ou mettre à jour le fichier
        const fileName = pathParts[pathParts.length - 1];
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        // Mettre à jour le localPath dans le backend si nécessaire
        if (!appFile.localPath) {
          await api.api.updateFileMetadata(appFile.id, {
            localPath: filePath,
            lastLocalSync: Date.now(),
          });
        }

        syncedCount++;
      } catch (error) {
        // Continuer avec le fichier suivant en cas d'erreur
      }
    }

    lastSyncTime = Date.now();
    isSyncing = false;

    return {
      success: true,
      syncedCount,
      totalFiles: appFiles.length,
    };
  } catch (error) {
    isSyncing = false;
    return { success: false, error: error.message };
  }
};

// Construire le chemin d'un fichier basé sur la structure de dossiers dans le backend
const buildFilePathFromBackend = async (fileId: string, allFiles: any[]): Promise<string> => {
  const file = allFiles.find(f => f.id === fileId);
  if (!file) return '';
  
  const pathParts: string[] = [file.nom];
  let currentParentId = file.parentId;
  
  // Remonter la hiérarchie des dossiers
  while (currentParentId) {
    const parent = allFiles.find(f => f.id === currentParentId && f.type === 'dossier');
    if (!parent) break;
    
    pathParts.unshift(parent.nom);
    currentParentId = parent.parentId;
  }
  
  return pathParts.join('/');
};

// Synchronisation bidirectionnelle
export const syncBidirectional = async (onProgress) => {
  // D'abord, synchroniser depuis le dossier local
  const fromLocal = await syncFromLocalFolder(onProgress);
  if (!fromLocal.success) {
    return fromLocal;
  }

  // Ensuite, synchroniser vers le dossier local
  const toLocal = await syncToLocalFolder(onProgress);
  return {
    success: toLocal.success,
    fromLocal: fromLocal,
    toLocal: toLocal,
  };
};

// Démarrer la synchronisation automatique
export const startAutoSync = async (intervalMs = 30000) => {
  // Vérifier que le handle existe
  if (!syncDirectoryHandle) {
    const folderName = localStorage.getItem('monDrive_syncFolderName');
    if (!folderName) {
      throw new Error('Aucun dossier de synchronisation sélectionné. Veuillez sélectionner un dossier d\'abord.');
    }
    // Le handle doit être re-sélectionné par l'utilisateur
    throw new Error('Le dossier de synchronisation doit être re-sélectionné. Veuillez cliquer sur "Sélectionner un dossier" d\'abord.');
  }

  // Sauvegarder l'intervalle
  localStorage.setItem('monDrive_syncInterval', intervalMs.toString());

  if (syncInterval) {
    stopAutoSync();
  }

  // Faire une première synchronisation immédiate
  try {
    await syncBidirectional();
  } catch (error) {
    // Ne pas bloquer le démarrage si la première sync échoue
  }

  syncInterval = setInterval(async () => {
    if (!isSyncing && syncDirectoryHandle) {
      try {
        await syncBidirectional();
      } catch (error) {
        // Si le handle n'existe plus, arrêter la synchronisation
        if (error.message && (error.message.includes('re-sélectionner') || error.message.includes('Aucun dossier'))) {
          stopAutoSync();
          // Notifier l'utilisateur via un événement
          window.dispatchEvent(new CustomEvent('syncStopped', { 
            detail: { reason: 'Le dossier de synchronisation doit être re-sélectionné' }
          }));
        }
      }
    }
  }, intervalMs);
};

// Arrêter la synchronisation automatique
export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

// Obtenir le statut de la synchronisation
export const getSyncStatus = () => {
  return {
    isActive: syncInterval !== null,
    isSyncing,
    lastSyncTime,
    syncPath,
    hasFolder: syncDirectoryHandle !== null || localStorage.getItem('monDrive_syncFolderName') !== null,
  };
};

// Réinitialiser la synchronisation
export const resetSync = () => {
  stopAutoSync();
  syncDirectoryHandle = null;
  syncSubFolderPath = null;
  syncPath = null;
  lastSyncTime = null;
  localStorage.removeItem('monDrive_syncFolderName');
  localStorage.removeItem('monDrive_syncSubFolderPath');
};

// Obtenir le chemin complet du dossier synchronisé
export const getSyncPath = () => {
  if (!syncPath) return null;
  if (syncSubFolderPath) {
    return `${syncPath}/${syncSubFolderPath}`;
  }
  return syncPath;
};

