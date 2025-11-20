export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
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
  estFavori?: boolean;
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

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: string;
  userId: string;
  userName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}
