import type { FileItem, ShareLink } from '../types';

const FILES_KEY = 'monDrive_files';
const FILE_CONTENTS_KEY = 'monDrive_fileContents';
const SHARE_LINKS_KEY = 'monDrive_shareLinks';

// Stocker le contenu des fichiers (en base64 pour localStorage)
export const saveFileContent = async (fileId: string, file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const contents = localStorage.getItem(FILE_CONTENTS_KEY);
        const fileContents = contents ? JSON.parse(contents) : {};
        fileContents[fileId] = reader.result as string; // base64
        localStorage.setItem(FILE_CONTENTS_KEY, JSON.stringify(fileContents));
        // Également sauvegarder avec une clé spécifique pour faciliter l'accès
        localStorage.setItem(`monDrive_fileContent_${fileId}`, reader.result as string);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Récupérer le contenu d'un fichier
export const getFileContent = (fileId: string): string | null => {
  try {
    const contents = localStorage.getItem(FILE_CONTENTS_KEY);
    if (!contents) return null;
    const fileContents = JSON.parse(contents);
    return fileContents[fileId] || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu:', error);
    return null;
  }
};

// Supprimer le contenu d'un fichier
export const deleteFileContent = (fileId: string): void => {
  try {
    const contents = localStorage.getItem(FILE_CONTENTS_KEY);
    if (!contents) return;
    const fileContents = JSON.parse(contents);
    delete fileContents[fileId];
    localStorage.setItem(FILE_CONTENTS_KEY, JSON.stringify(fileContents));
  } catch (error) {
    console.error('Erreur lors de la suppression du contenu:', error);
  }
};

// Convertir base64 en Blob
export const base64ToBlob = (base64: string, mimeType?: string): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType || 'application/octet-stream' });
};

// Gestion des liens de partage
export const saveShareLink = (link: ShareLink): void => {
  try {
    const links = localStorage.getItem(SHARE_LINKS_KEY);
    const shareLinks: Record<string, ShareLink> = links ? JSON.parse(links) : {};
    shareLinks[link.token] = link;
    localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(shareLinks));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du lien:', error);
  }
};

export const getShareLink = (token: string): ShareLink | null => {
  try {
    const links = localStorage.getItem(SHARE_LINKS_KEY);
    if (!links) return null;
    const shareLinks: Record<string, ShareLink> = JSON.parse(links);
    return shareLinks[token] || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du lien:', error);
    return null;
  }
};

export const deleteShareLink = (token: string): void => {
  try {
    const links = localStorage.getItem(SHARE_LINKS_KEY);
    if (!links) return;
    const shareLinks: Record<string, ShareLink> = JSON.parse(links);
    delete shareLinks[token];
    localStorage.setItem(SHARE_LINKS_KEY, JSON.stringify(shareLinks));
  } catch (error) {
    console.error('Erreur lors de la suppression du lien:', error);
  }
};

export const getAllShareLinks = (): ShareLink[] => {
  try {
    const links = localStorage.getItem(SHARE_LINKS_KEY);
    if (!links) return [];
    const shareLinks: Record<string, ShareLink> = JSON.parse(links);
    return Object.values(shareLinks);
  } catch (error) {
    console.error('Erreur lors de la récupération des liens:', error);
    return [];
  }
};

export const getShareLinkByFileId = (fileId: string): ShareLink | null => {
  try {
    const allLinks = getAllShareLinks();
    return allLinks.find(link => link.fichierId === fileId) || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du lien par fichier:', error);
    return null;
  }
};

