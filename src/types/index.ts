export type UserRole = 'admin' | 'user';
export type PermissionType = 'read' | 'write' | 'delete' | 'share';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role?: UserRole;
  status?: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
  bloque?: boolean; // Utilisateur bloqué par un admin
  dateCreation?: string;
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
  tags?: string[]; // Étiquettes du fichier/dossier
  proprietaireId?: string; // ID de l'utilisateur propriétaire
  permissions?: FilePermissions; // Permissions sur le fichier/dossier
  dateSuppression?: string; // Date de suppression pour la corbeille (rétention 1 mois)
}

export interface FilePermissions {
  [userId: string]: PermissionType[]; // Permissions par utilisateur
  public?: PermissionType[]; // Permissions publiques
}

export interface ShareLink {
  id: string;
  fichierId: string;
  token: string;
  url: string;
  dateExpiration?: string;
  actif: boolean;
  shareWithCompany?: boolean; // Partagé avec toute la boîte
}

export interface CompanyShare {
  id: string;
  fichierId: string;
  sharedByUserId: string; // ID de l'utilisateur qui a partagé
  sharedByUserName: string; // Nom de l'utilisateur qui a partagé
  datePartage: string;
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

// Journalisation des actions (logs)
export interface ActivityLog {
  id: string;
  type: 'file_created' | 'file_modified' | 'file_deleted' | 'file_shared' | 
        'folder_created' | 'folder_deleted' | 'user_created' | 'user_blocked' | 
        'user_unblocked' | 'user_deleted' | 'password_reset' | 'permission_changed' | 'sync_success' | 'sync_error';
  userId: string;
  userName: string;
  description: string;
  timestamp: string;
  details?: {
    fileId?: string;
    fileName?: string;
    targetUserId?: string;
    error?: string; // Cause de l'échec
    success?: boolean;
  };
  accessibleBy?: string[]; // Utilisateurs autorisés à voir ce log
}

// Notification améliorée avec cause d'échec
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  titre: string;
  message: string;
  timestamp: string;
  lu: boolean;
  lien?: string;
  errorCause?: string; // Cause de l'échec si type = 'error'
  actionType?: string; // Type d'action (upload, sync, delete, etc.)
}
