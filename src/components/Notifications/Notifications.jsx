import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import api from '../../services/api';
import './Notifications.scss';

export const Notifications = ({ onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
    
    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket
    const unsubscribeNotificationCreated = onWebSocketEvent('notification_created', (data) => {
      if (data.notification.userId === user?.id) {
        loadNotifications();
      }
    });
    const unsubscribeNotificationUpdated = onWebSocketEvent('notification_updated', (data) => {
      if (data.notification.userId === user?.id) {
        loadNotifications();
      }
    });
    const unsubscribeNotificationDeleted = onWebSocketEvent('notification_deleted', () => {
      loadNotifications();
    });

    // Recharger toutes les 10 secondes en fallback
    const interval = setInterval(loadNotifications, 10000);
    
    return () => {
      clearInterval(interval);
      unsubscribeNotificationCreated();
      unsubscribeNotificationUpdated();
      unsubscribeNotificationDeleted();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadNotifications = async () => {
    try {
      const apiNotifications = await api.getNotifications();
      setNotifications(apiNotifications.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      setNotifications([]);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      await loadNotifications();
    } catch (error) {
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.lu);
      await Promise.all(unreadNotifications.map(n => api.markNotificationAsRead(n.id)));
      await loadNotifications();
    } catch (error) {
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.deleteNotification(id);
      await loadNotifications();
    } catch (error) {
    }
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  return (
    <div className="notifications-panel">
      <div className="notifications-header">
        <h3>Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h3>
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button className="btn-link" onClick={markAllAsRead}>
              Tout marquer comme lu
            </button>
          )}
          <button className="notifications-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.lu ? 'unread' : ''}`}
              onClick={() => {
                if (!notif.lu) markAsRead(notif.id);
                if (notif.lien) window.location.href = notif.lien;
              }}
            >
              <div className="notification-icon">
                {notif.type === 'file_shared' && '🔗'}
                {notif.type === 'event_reminder' && '📅'}
                {notif.type === 'task_assigned' && '✅'}
                {notif.type === 'message' && '💬'}
                {notif.type === 'mention' && '@'}
              </div>
              <div className="notification-content">
                <div className="notification-title">{notif.titre}</div>
                <div className="notification-message">{notif.message}</div>
                {notif.errorCause && (
                  <div className="notification-error-cause">
                    <strong>Cause de l'échec :</strong> {notif.errorCause}
                  </div>
                )}
                <div className="notification-time">
                  {new Date(notif.timestamp).toLocaleString('fr-FR')}
                </div>
              </div>
              <button
                className="notification-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif.id);
                }}
              >
                ✕
              </button>
            </div>
          ))
        ) : (
          <div className="notifications-empty">Aucune notification</div>
        )}
      </div>
    </div>
  );
};

