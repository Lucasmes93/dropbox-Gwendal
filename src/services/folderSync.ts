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
let syncInterval: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;
let lastSyncTime: number | null = null;
let syncPath: string | null = null;

// Vérifier si l'API File System Access est disponible
export const isFileSystemAccessSupported = () => {
  return 'showDirectoryPicker' in window;
};

// Sélectionner un dossier de synchronisation
export const selectSyncFolder = async () => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('L\'API File System Access n\'est pas supportée par votre navigateur. Utilisez Chrome, Edge ou Opera.');
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });
    
    syncDirectoryHandle = handle;
    syncPath = handle.name;
    
    // Sauvegarder la référence du dossier dans localStorage (via permission)
    // Note: On ne peut pas stocker le handle directement, mais on peut demander à nouveau
    localStorage.setItem('monDrive_syncFolderName', handle.name);
    
    return {
      success: true,
      folderName: handle.name,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Sélection annulée' };
    }
    throw error;
  }
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
        console.error(`Erreur lors de la lecture de ${entry.name}:`, error);
      }
    } else if (entry.kind === 'directory') {
      const subFiles = await readDirectoryRecursive(entry as FileSystemDirectoryHandle, entryPath);
      files.push(...subFiles);
    }
  }
  
  return files;
};

// Synchroniser les fichiers du dossier local vers l'application
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
    
    // Lire tous les fichiers du dossier
    const localFiles = await readDirectoryRecursive(dirHandle);
    
    if (onProgress) {
      onProgress({ total: localFiles.length, current: 0, status: 'Lecture des fichiers...' });
    }

    // Charger les fichiers existants dans l'application
    const saved = localStorage.getItem('monDrive_files');
    const existingFiles = saved ? JSON.parse(saved) : [];
    
    let syncedCount = 0;
    const { saveFileContent } = await import('./storage');

    // Fonction pour générer un ID unique
    const generateId = () => {
      return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // Pour chaque fichier local, vérifier s'il existe déjà ou le créer
    for (let i = 0; i < localFiles.length; i++) {
      const localFile = localFiles[i];
      
      if (onProgress) {
        onProgress({ 
          total: localFiles.length, 
          current: i + 1, 
          status: `Synchronisation de ${localFile.name}...` 
        });
      }

      // Vérifier si le fichier existe déjà (par nom et chemin)
      const existingFile = existingFiles.find(f => 
        f.nom === localFile.name && 
        f.localPath === localFile.path
      );

      if (!existingFile || existingFile.lastLocalSync !== localFile.lastModified) {
        // Créer ou mettre à jour le fichier
        const fileId = existingFile?.id || generateId();
        
        const fileItem = {
          id: fileId,
          nom: localFile.name,
          type: 'fichier',
          taille: localFile.file.size,
          dateModification: new Date(localFile.lastModified).toISOString(),
          extension: localFile.name.split('.').pop()?.toLowerCase() || '',
          mimeType: localFile.file.type || 'application/octet-stream',
          localPath: localFile.path,
          lastLocalSync: localFile.lastModified,
          syncedFromLocal: true,
        };

        // Sauvegarder le contenu du fichier
        await saveFileContent(fileId, localFile.file);

        // Ajouter ou mettre à jour dans la liste
        if (existingFile) {
          const index = existingFiles.findIndex(f => f.id === fileId);
          existingFiles[index] = fileItem;
        } else {
          existingFiles.push(fileItem);
        }

        syncedCount++;
      }
    }

    // Sauvegarder la liste mise à jour
    localStorage.setItem('monDrive_files', JSON.stringify(existingFiles));
    window.dispatchEvent(new Event('filesUpdated'));

    lastSyncTime = Date.now();
    isSyncing = false;

    return {
      success: true,
      syncedCount,
      totalFiles: localFiles.length,
    };
  } catch (error) {
    isSyncing = false;
    console.error('Erreur lors de la synchronisation:', error);
    return { success: false, error: error.message };
  }
};

// Synchroniser les fichiers de l'application vers le dossier local
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

    // Charger les fichiers de l'application
    const saved = localStorage.getItem('monDrive_files');
    const appFiles = saved ? JSON.parse(saved).filter(f => f.syncedFromLocal) : [];

    if (onProgress) {
      onProgress({ total: appFiles.length, current: 0, status: 'Synchronisation vers le dossier local...' });
    }

    const { getFileContent, base64ToBlob } = await import('./storage');
    let syncedCount = 0;

    // Pour chaque fichier, l'écrire dans le dossier local
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
        // Récupérer le contenu du fichier
        const fileContent = getFileContent(appFile.id);
        if (!fileContent) continue;

        // Convertir en Blob
        const blob = base64ToBlob(fileContent, appFile.mimeType);

        // Créer le chemin du fichier (gérer les sous-dossiers)
        const pathParts = appFile.localPath.split('/');
        let currentDir = dirHandle;

        // Créer les sous-dossiers si nécessaire
        for (let j = 0; j < pathParts.length - 1; j++) {
          const dirName = pathParts[j];
          try {
            currentDir = await currentDir.getDirectoryHandle(dirName, { create: true });
          } catch (error) {
            console.error(`Erreur lors de la création du dossier ${dirName}:`, error);
            break;
          }
        }

        // Créer ou mettre à jour le fichier
        const fileName = pathParts[pathParts.length - 1];
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        syncedCount++;
      } catch (error) {
        console.error(`Erreur lors de l'écriture de ${appFile.nom}:`, error);
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
    console.error('Erreur lors de la synchronisation:', error);
    return { success: false, error: error.message };
  }
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
    console.error('Erreur lors de la synchronisation initiale:', error);
    // Ne pas bloquer le démarrage si la première sync échoue
  }

  syncInterval = setInterval(async () => {
    if (!isSyncing && syncDirectoryHandle) {
      try {
        await syncBidirectional();
      } catch (error) {
        console.error('Erreur lors de la synchronisation automatique:', error);
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
  syncPath = null;
  lastSyncTime = null;
  localStorage.removeItem('monDrive_syncFolderName');
};

