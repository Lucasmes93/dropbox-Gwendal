import { useState, useEffect } from 'react';
import './Notifications.scss';

export const Notifications = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
    const handleUpdate = () => loadNotifications();
    window.addEventListener('notificationUpdated', handleUpdate);
    return () => window.removeEventListener('notificationUpdated', handleUpdate);
  }, []);

  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem('monDrive_notifications');
      if (saved) {
        const loaded = JSON.parse(saved);
        setNotifications(loaded.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, lu: true } : n
    );
    localStorage.setItem('monDrive_notifications', JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event('notificationUpdated'));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, lu: true }));
    localStorage.setItem('monDrive_notifications', JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event('notificationUpdated'));
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem('monDrive_notifications', JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event('notificationUpdated'));
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

