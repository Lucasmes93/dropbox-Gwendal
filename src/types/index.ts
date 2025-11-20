export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

export interface FileItem {
  id: string;
  nom: string;
  type: 'fichier' | 'dossier';
  taille?: number;
  dateModification: string;
  parentId?: string;
  extension?: string;
  estSupprime?: boolean;
  mimeType?: string; // Type MIME du fichier
}

export interface ShareLink {
  id: string;
  fichierId: string;
  token: string;
  url: string;
  dateExpiration?: string;
  actif: boolean;
}

export interface StorageInfo {
  utilise: number;
  total: number;
}

