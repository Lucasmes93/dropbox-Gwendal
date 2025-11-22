// Service de notifications amélioré
// Conforme au cahier des charges : "Chaque échec doit être notifié, ainsi que sa cause"

import type { Notification } from '../types';

const NOTIFICATIONS_KEY = 'monDrive_notifications';

// Créer une notification
export const createNotification = (
  type: Notification['type'],
  titre: string,
  message: string,
  errorCause?: string,
  actionType?: string,
  lien?: string
) => {
  try {
    const notifications = getNotifications();
    const newNotification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      titre,
      message,
      timestamp: new Date().toISOString(),
      lu: false,
      lien,
      errorCause, // Cause de l'échec si type = 'error'
      actionType, // Type d'action (upload, sync, delete, etc.)
    };

    notifications.push(newNotification);
    
    // Garder seulement les 500 dernières notifications
    const maxNotifications = 500;
    if (notifications.length > maxNotifications) {
      notifications.splice(0, notifications.length - maxNotifications);
    }

    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    
    // Déclencher un événement pour notifier les composants
    window.dispatchEvent(new CustomEvent('notificationUpdated', { detail: newNotification }));
    window.dispatchEvent(new Event('notificationUpdated'));
    
    return newNotification;
  } catch (error) {
    return null;
  }
};

// Notification de succès
export const notifySuccess = (titre: string, message: string, actionType?: string, lien?: string) => {
  return createNotification('success', titre, message, undefined, actionType, lien);
};

// Notification d'erreur avec cause
export const notifyError = (
  titre: string,
  message: string,
  errorCause: string,
  actionType?: string,
  lien?: string
) => {
  return createNotification('error', titre, message, errorCause, actionType, lien);
};

// Notification d'information
export const notifyInfo = (titre: string, message: string, actionType?: string, lien?: string) => {
  return createNotification('info', titre, message, undefined, actionType, lien);
};

// Notification d'avertissement
export const notifyWarning = (titre: string, message: string, actionType?: string, lien?: string) => {
  return createNotification('warning', titre, message, undefined, actionType, lien);
};

// Récupérer toutes les notifications
export const getNotifications = (): Notification[] => {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
};

// Marquer une notification comme lue
export const markNotificationAsRead = (id: string) => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map(n =>
      n.id === id ? { ...n, lu: true } : n
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('notificationUpdated'));
    return true;
  } catch (error) {
    return false;
  }
};

// Marquer toutes les notifications comme lues
export const markAllNotificationsAsRead = () => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map(n => ({ ...n, lu: true }));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('notificationUpdated'));
    return true;
  } catch (error) {
    return false;
  }
};

// Supprimer une notification
export const deleteNotification = (id: string) => {
  try {
    const notifications = getNotifications();
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('notificationUpdated'));
    return true;
  } catch (error) {
    return false;
  }
};

// Exemples d'utilisation :
// notifySuccess('Fichier téléversé', 'Le fichier "rapport.pdf" a été téléversé avec succès', 'upload');
// notifyError('Échec du téléversement', 'Impossible de téléverser le fichier', 'Taille du fichier trop importante (max 100MB)', 'upload');
// notifyError('Échec de synchronisation', 'La synchronisation a échoué', 'Connexion au serveur perdue', 'sync');

