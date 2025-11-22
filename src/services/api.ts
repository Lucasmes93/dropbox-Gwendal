// Service API pour communiquer avec le backend
// Remplace les appels localStorage par des appels API réels

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fonction utilitaire pour les appels API
async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
      throw new Error(error.error || `Erreur ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Vérifier si c'est une erreur de connexion (backend non démarré)
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED'))) {
      const friendlyError = new Error(
        'Le serveur backend n\'est pas accessible.\n\n' +
        'Assurez-vous que le backend est démarré :\n' +
        '1. Ouvrez un terminal\n' +
        '2. Exécutez : cd server && npm run dev\n' +
        'Ou utilisez : npm run dev:full'
      );
      throw friendlyError;
    }
    throw error;
  }
}

// ==================== AUTHENTIFICATION ====================

export const api = {
  // Connexion
  login: async (email: string, password: string) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Sauvegarder le token
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  // Inscription
  register: async (nom: string, prenom: string, email: string, password: string) => {
    const response = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nom, prenom, email, password }),
    });
    
    // Sauvegarder le token
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  // Vérifier le token
  verifyToken: async () => {
    return await apiCall('/auth/verify');
  },

  // ==================== UTILISATEURS ====================

  // Récupérer tous les utilisateurs (admin)
  getUsers: async () => {
    return await apiCall('/users');
  },

  // Récupérer un utilisateur
  getUser: async (id: string) => {
    return await apiCall(`/users/${id}`);
  },

  // Créer un utilisateur (admin)
  createUser: async (userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    return await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Bloquer/débloquer un utilisateur (admin)
  toggleBlockUser: async (id: string) => {
    return await apiCall(`/users/${id}/block`, {
      method: 'PATCH',
    });
  },

  // Réinitialiser le mot de passe (admin)
  resetPassword: async (id: string) => {
    return await apiCall(`/users/${id}/reset-password`, {
      method: 'POST',
    });
  },

  // Supprimer un utilisateur (admin) - Suppression complète
  deleteUser: async (id: string) => {
    return await apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Mettre à jour le profil utilisateur
  updateUser: async (id: string, userData: {
    nom?: string;
    prenom?: string;
    email?: string;
    status?: 'online' | 'away' | 'busy' | 'offline';
    role?: 'admin' | 'user';
  }) => {
    return await apiCall(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  // Changer le mot de passe
  changePassword: async (id: string, oldPassword: string, newPassword: string) => {
    return await apiCall(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  // ==================== FICHIERS ====================

  // Récupérer tous les fichiers
  getFiles: async () => {
    return await apiCall('/files');
  },

  // Téléverser un fichier
  uploadFile: async (file: File, parentId?: string, isCreation: boolean = false) => {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) {
      formData.append('parentId', parentId);
    }
    if (isCreation) {
      formData.append('isCreation', 'true');
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
      throw new Error(error.error || `Erreur ${response.status}`);
    }

    return await response.json();
  },

  // Créer un dossier
  createFolder: async (nom: string, parentId?: string) => {
    return await apiCall('/files/folder', {
      method: 'POST',
      body: JSON.stringify({ nom, parentId }),
    });
  },

  // Supprimer un fichier/dossier
  deleteFile: async (id: string) => {
    return await apiCall(`/files/${id}`, {
      method: 'DELETE',
    });
  },

  // Récupérer un fichier par ID
  getFile: async (id: string) => {
    return await apiCall(`/files/${id}`);
  },

  // Mettre à jour le contenu d'un fichier
  updateFileContent: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/files/${id}/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
      throw new Error(error.error || `Erreur ${response.status}`);
    }

    return await response.json();
  },

  // Verrouiller un fichier
  lockFile: async (id: string) => {
    return await apiCall(`/files/${id}/lock`, {
      method: 'POST',
    });
  },

  // Déverrouiller un fichier
  unlockFile: async (id: string) => {
    return await apiCall(`/files/${id}/unlock`, {
      method: 'POST',
    });
  },

  // Télécharger un fichier
  downloadFile: async (id: string, filename: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/files/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Renommer un fichier/dossier
  renameFile: async (id: string, newName: string) => {
    return await apiCall(`/files/${id}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ nom: newName }),
    });
  },

  // Déplacer un fichier/dossier
  moveFile: async (id: string, parentId?: string) => {
    return await apiCall(`/files/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ parentId: parentId || null }),
    });
  },

  // Restaurer un fichier/dossier depuis la corbeille
  restoreFile: async (id: string) => {
    return await apiCall(`/files/${id}/restore`, {
      method: 'PATCH',
    });
  },

  // Appliquer les permissions à tous les enfants d'un dossier
  applyPermissionsToChildren: async (folderId: string, permissions: any) => {
    return await apiCall(`/files/${folderId}/apply-permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    });
  },

  // Mettre à jour les métadonnées (tags, favoris, permissions)
  updateFileMetadata: async (id: string, metadata: {
    tags?: string[];
    estFavori?: boolean;
    permissions?: any;
    localPath?: string;
    lastLocalSync?: number;
  }) => {
    return await apiCall(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata),
    });
  },

  // ==================== ACTIVITÉ ====================

  // Récupérer les logs d'activité
  getActivityLogs: async () => {
    return await apiCall('/activity');
  },

  // Créer un log d'activité
  createActivityLog: async (logData: {
    type: string;
    description: string;
    details?: any;
    accessibleBy?: string[];
  }) => {
    return await apiCall('/activity', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  },

  // ==================== NOTIFICATIONS ====================

  // Récupérer les notifications
  getNotifications: async () => {
    return await apiCall('/notifications');
  },

  // Créer une notification
  createNotification: async (notificationData: {
    type: string;
    titre: string;
    message: string;
    errorCause?: string;
    actionType?: string;
  }) => {
    return await apiCall('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  // Marquer une notification comme lue
  markNotificationAsRead: async (id: string) => {
    return await apiCall(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  // Supprimer une notification
  deleteNotification: async (id: string) => {
    return await apiCall(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== CALENDAR ====================

  // Récupérer tous les événements
  getCalendarEvents: async () => {
    return await apiCall('/calendar');
  },

  // Créer un événement
  createCalendarEvent: async (eventData: {
    titre: string;
    description?: string;
    dateDebut: string;
    dateFin?: string;
    couleur?: string;
  }) => {
    return await apiCall('/calendar', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  // Mettre à jour un événement
  updateCalendarEvent: async (id: string, eventData: {
    titre?: string;
    description?: string;
    dateDebut?: string;
    dateFin?: string;
    couleur?: string;
  }) => {
    return await apiCall(`/calendar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    });
  },

  // Supprimer un événement
  deleteCalendarEvent: async (id: string) => {
    return await apiCall(`/calendar/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== NOTES ====================

  // Récupérer toutes les notes
  getNotes: async () => {
    return await apiCall('/notes');
  },

  // Créer une note
  createNote: async (noteData: {
    titre?: string;
    contenu?: string;
  }) => {
    return await apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  // Mettre à jour une note
  updateNote: async (id: string, noteData: {
    titre?: string;
    contenu?: string;
  }) => {
    return await apiCall(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(noteData),
    });
  },

  // Supprimer une note
  deleteNote: async (id: string) => {
    return await apiCall(`/notes/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== TASKS ====================

  // Récupérer toutes les tâches
  getTasks: async () => {
    return await apiCall('/tasks');
  },

  // Créer une tâche
  createTask: async (taskData: {
    titre: string;
    description?: string;
    statut?: 'a_faire' | 'en_cours' | 'termine';
    priorite?: 'urgente' | 'haute' | 'normale' | 'basse';
    dateEcheance?: string;
  }) => {
    return await apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  // Mettre à jour une tâche
  updateTask: async (id: string, taskData: {
    titre?: string;
    description?: string;
    statut?: 'a_faire' | 'en_cours' | 'termine';
    priorite?: 'urgente' | 'haute' | 'normale' | 'basse';
    dateEcheance?: string;
  }) => {
    return await apiCall(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  },

  // Supprimer une tâche
  deleteTask: async (id: string) => {
    return await apiCall(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== BOARDS ====================

  // Récupérer tous les tableaux
  getBoards: async () => {
    return await apiCall('/boards');
  },

  // Créer un tableau
  createBoard: async (boardData: {
    nom?: string;
    colonnes?: any[];
  }) => {
    return await apiCall('/boards', {
      method: 'POST',
      body: JSON.stringify(boardData),
    });
  },

  // Mettre à jour un tableau
  updateBoard: async (id: string, boardData: {
    nom?: string;
    colonnes?: any[];
  }) => {
    return await apiCall(`/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(boardData),
    });
  },

  // Supprimer un tableau
  deleteBoard: async (id: string) => {
    return await apiCall(`/boards/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== CONTACTS ====================

  // Récupérer tous les contacts
  getContacts: async () => {
    return await apiCall('/contacts');
  },

  // Créer un contact
  createContact: async (contactData: {
    nom: string;
    prenom?: string;
    email: string;
    telephone?: string;
    entreprise?: string;
    notes?: string;
  }) => {
    return await apiCall('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  },

  // Mettre à jour un contact
  updateContact: async (id: string, contactData: {
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    entreprise?: string;
    notes?: string;
  }) => {
    return await apiCall(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(contactData),
    });
  },

  // Supprimer un contact
  deleteContact: async (id: string) => {
    return await apiCall(`/contacts/${id}`, {
      method: 'DELETE',
    });
  },
};

export default api;

