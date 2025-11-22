// Service de journalisation des actions (logs)
// Conforme au cahier des charges : "Chaque action doit être répertoriée et doit être accessible aux personnes autorisées"

import type { ActivityLog } from '../types';

const LOGS_KEY = 'monDrive_activityLogs';

// Créer un log d'activité
export const logActivity = (
  type: ActivityLog['type'],
  userId: string,
  userName: string,
  description: string,
  details?: ActivityLog['details'],
  accessibleBy?: string[] // Si non spécifié, accessible par tous les admins
) => {
  try {
    const logs = getLogs();
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId,
      userName,
      description,
      timestamp: new Date().toISOString(),
      details,
      accessibleBy: accessibleBy || ['admin'], // Par défaut, accessible par les admins
    };

    logs.push(newLog);
    
    // Garder seulement les 1000 derniers logs pour éviter de saturer localStorage
    const maxLogs = 1000;
    if (logs.length > maxLogs) {
      logs.splice(0, logs.length - maxLogs);
    }

    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    
    // Déclencher un événement pour notifier les composants
    window.dispatchEvent(new CustomEvent('activityLogUpdated', { detail: newLog }));
    window.dispatchEvent(new Event('activityUpdated')); // Pour la page Activity
    
    return newLog;
  } catch (error) {
    return null;
  }
};

// Récupérer tous les logs
export const getLogs = (): ActivityLog[] => {
  try {
    const saved = localStorage.getItem(LOGS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
};

// Récupérer les logs accessibles par un utilisateur
export const getLogsForUser = (userId: string, isAdmin: boolean): ActivityLog[] => {
  const logs = getLogs();
  
  if (isAdmin) {
    // Les admins voient tous les logs
    return logs;
  }
  
  // Les utilisateurs voient seulement les logs où ils sont autorisés
  return logs.filter(log => 
    log.accessibleBy?.includes(userId) || 
    log.userId === userId || // L'utilisateur voit ses propres actions
    log.accessibleBy?.includes('public')
  );
};

// Récupérer les logs filtrés par type
export const getLogsByType = (type: ActivityLog['type'], userId?: string, isAdmin?: boolean): ActivityLog[] => {
  const logs = userId && isAdmin !== undefined 
    ? getLogsForUser(userId, isAdmin)
    : getLogs();
  
  return logs.filter(log => log.type === type);
};

// Récupérer les logs d'erreurs
export const getErrorLogs = (userId?: string, isAdmin?: boolean): ActivityLog[] => {
  const logs = userId && isAdmin !== undefined 
    ? getLogsForUser(userId, isAdmin)
    : getLogs();
  
  return logs.filter(log => 
    log.type === 'sync_error' || 
    (log.details?.error !== undefined)
  );
};

// Exemples d'utilisation :
// logActivity('file_created', user.id, user.nom, 'a créé le fichier "rapport.pdf"', { fileId: '123', fileName: 'rapport.pdf' });
// logActivity('sync_error', user.id, user.nom, 'Échec de synchronisation', { error: 'Connexion perdue', success: false });
// logActivity('user_blocked', admin.id, admin.nom, 'a bloqué l\'utilisateur', { targetUserId: '456' }, ['admin']);

