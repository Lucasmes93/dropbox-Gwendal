import type { FileItem, ShareLink, CompanyShare } from '../types';

const FILES_KEY = 'monDrive_files';
const FILE_CONTENTS_KEY = 'monDrive_fileContents';
const SHARE_LINKS_KEY = 'monDrive_shareLinks';
const COMPANY_SHARES_KEY = 'monDrive_companyShares';

// Fonction pour tester réellement le quota disponible
const testStorageQuota = (testData: string): boolean => {
  try {
    const testKey = '__quota_test__';
    localStorage.setItem(testKey, testData);
    localStorage.removeItem(testKey);
    return true;
  } catch (e: any) {
    return e.name === 'QuotaExceededError';
  }
};

// Stocker le contenu des fichiers (en base64 pour localStorage)
export const saveFileContent = async (fileId: string, file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const contents = localStorage.getItem(FILE_CONTENTS_KEY);
        const fileContents = contents ? JSON.parse(contents) : {};
        const base64Content = reader.result as string;
        
        // Vérifier la taille estimée
        const estimatedSize = base64Content.length;
        
        // Tester avec un petit échantillon pour voir si on a assez d'espace
        const testSize = Math.min(estimatedSize, 10000); // Tester avec 10KB ou la taille réelle si plus petite
        if (!testStorageQuota('x'.repeat(testSize))) {
          reject(new Error('QuotaExceededError: L\'espace de stockage est insuffisant. Veuillez supprimer des fichiers.'));
          return;
        }
        
        // Sauvegarder uniquement dans l'objet centralisé (pas de duplication)
        fileContents[fileId] = base64Content;
        
        // Tester avec la taille réelle avant de sauvegarder
        const testData = JSON.stringify({ ...fileContents, [fileId]: base64Content });
        if (!testStorageQuota(testData.substring(0, Math.min(testData.length, 50000)))) {
          reject(new Error('QuotaExceededError: L\'espace de stockage est insuffisant. Veuillez supprimer des fichiers.'));
          return;
        }
        
        localStorage.setItem(FILE_CONTENTS_KEY, JSON.stringify(fileContents));
        resolve();
      } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.message?.includes('QuotaExceededError')) {
          reject(new Error('QuotaExceededError: L\'espace de stockage est plein. Veuillez supprimer des fichiers.'));
        } else {
          reject(error);
        }
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
    if (!contents) {
      // Fallback: essayer l'ancienne méthode pour compatibilité
      const oldContent = localStorage.getItem(`monDrive_fileContent_${fileId}`);
      if (oldContent) return oldContent;
      return null;
    }
    const fileContents = JSON.parse(contents);
    return fileContents[fileId] || null;
  } catch (error) {
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
  }
};

export const getShareLink = (token: string): ShareLink | null => {
  try {
    const links = localStorage.getItem(SHARE_LINKS_KEY);
    if (!links) return null;
    const shareLinks: Record<string, ShareLink> = JSON.parse(links);
    return shareLinks[token] || null;
  } catch (error) {
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
  }
};

export const getAllShareLinks = (): ShareLink[] => {
  try {
    const links = localStorage.getItem(SHARE_LINKS_KEY);
    if (!links) return [];
    const shareLinks: Record<string, ShareLink> = JSON.parse(links);
    return Object.values(shareLinks);
  } catch (error) {
    return [];
  }
};

export const getShareLinkByFileId = (fileId: string): ShareLink | null => {
  try {
    const allLinks = getAllShareLinks();
    return allLinks.find(link => link.fichierId === fileId) || null;
  } catch (error) {
    return null;
  }
};

// Gestion des partages avec toute la boîte
export const saveCompanyShare = (share: CompanyShare): void => {
  try {
    const shares = localStorage.getItem(COMPANY_SHARES_KEY);
    const companyShares: Record<string, CompanyShare> = shares ? JSON.parse(shares) : {};
    companyShares[share.id] = share;
    localStorage.setItem(COMPANY_SHARES_KEY, JSON.stringify(companyShares));
  } catch (error) {
  }
};

export const getAllCompanyShares = (): CompanyShare[] => {
  try {
    const shares = localStorage.getItem(COMPANY_SHARES_KEY);
    if (!shares) return [];
    const companyShares: Record<string, CompanyShare> = JSON.parse(shares);
    return Object.values(companyShares).filter(share => share.actif);
  } catch (error) {
    return [];
  }
};

export const getCompanyShareByFileId = (fileId: string): CompanyShare | null => {
  try {
    const allShares = getAllCompanyShares();
    return allShares.find(share => share.fichierId === fileId) || null;
  } catch (error) {
    return null;
  }
};

export const deleteCompanyShare = (shareId: string): void => {
  try {
    const shares = localStorage.getItem(COMPANY_SHARES_KEY);
    if (!shares) return;
    const companyShares: Record<string, CompanyShare> = JSON.parse(shares);
    delete companyShares[shareId];
    localStorage.setItem(COMPANY_SHARES_KEY, JSON.stringify(companyShares));
  } catch (error) {
  }
};

