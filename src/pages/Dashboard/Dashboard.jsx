import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import './Dashboard.scss';

export const Dashboard = () => {
  const { user } = useAuth();
  const [recentFiles, setRecentFiles] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal] = useState(10 * 1024 * 1024 * 1024);

  useEffect(() => {
    loadDashboardData();
    
    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket
    const unsubscribeFileCreated = onWebSocketEvent('file_created', () => {
      loadDashboardData();
    });
    const unsubscribeFolderCreated = onWebSocketEvent('folder_created', () => {
      loadDashboardData();
    });
    const unsubscribeFileDeleted = onWebSocketEvent('file_deleted', () => {
      loadDashboardData();
    });
    const unsubscribeFileRenamed = onWebSocketEvent('file_renamed', () => {
      loadDashboardData();
    });
    const unsubscribeFileUpdated = onWebSocketEvent('file_updated', () => {
      loadDashboardData();
    });
    const unsubscribeNotificationCreated = onWebSocketEvent('notification_created', (data) => {
      if (data.notification.userId === user?.id) {
        loadDashboardData();
      }
    });
    const unsubscribeCalendarEventCreated = onWebSocketEvent('calendar_event_created', () => {
      loadDashboardData();
    });
    const unsubscribeCalendarEventUpdated = onWebSocketEvent('calendar_event_updated', () => {
      loadDashboardData();
    });
    const unsubscribeCalendarEventDeleted = onWebSocketEvent('calendar_event_deleted', () => {
      loadDashboardData();
    });
    const unsubscribeTaskCreated = onWebSocketEvent('task_created', () => {
      loadDashboardData();
    });
    const unsubscribeTaskUpdated = onWebSocketEvent('task_updated', () => {
      loadDashboardData();
    });
    const unsubscribeTaskDeleted = onWebSocketEvent('task_deleted', () => {
      loadDashboardData();
    });

    // Recharger toutes les 10 secondes en fallback (moins fréquent car WebSocket est prioritaire)
    const interval = setInterval(loadDashboardData, 10000);
    
    return () => {
      clearInterval(interval);
      unsubscribeFileCreated();
      unsubscribeFolderCreated();
      unsubscribeFileDeleted();
      unsubscribeFileRenamed();
      unsubscribeFileUpdated();
      unsubscribeNotificationCreated();
      unsubscribeCalendarEventCreated();
      unsubscribeCalendarEventUpdated();
      unsubscribeCalendarEventDeleted();
      unsubscribeTaskCreated();
      unsubscribeTaskUpdated();
      unsubscribeTaskDeleted();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Charger les fichiers récents depuis l'API
      const allFiles = await api.getFiles();
      
      // Filtrer uniquement les fichiers non supprimés
      const activeFiles = allFiles.filter(f => !f.estSupprime);
      
      const recent = activeFiles
        .sort((a, b) => 
          new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime()
        )
        .slice(0, 5);
      setRecentFiles(recent);

      // Calculer le stockage uniquement sur les fichiers actifs (non supprimés)
      const totalSize = activeFiles
        .filter(f => f.type === 'fichier' && f.taille && typeof f.taille === 'number')
        .reduce((sum, f) => sum + (f.taille || 0), 0);
      
      // S'assurer que le stockage est bien à 0 si aucun fichier
      setStorageUsed(totalSize || 0);
    } catch (error) {
      setRecentFiles([]);
      setStorageUsed(0);
    }

    // Charger les activités depuis l'API
    try {
      const logs = await api.getActivityLogs();
      setActivities(logs.slice(0, 10));
    } catch (error) {
      setActivities([]);
    }

    // Charger les notifications depuis l'API
    try {
      const allNotifications = await api.getNotifications();
      setNotifications(allNotifications.filter(n => !n.lu).slice(0, 5));
    } catch (error) {
      setNotifications([]);
    }

    // Charger les événements à venir depuis l'API
    try {
      const allEvents = await api.getCalendarEvents();
      const now = new Date();
      const upcoming = allEvents
        .filter(e => new Date(e.dateDebut) >= now)
        .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
        .slice(0, 5);
      setUpcomingEvents(upcoming);
    } catch (error) {
      setUpcomingEvents([]);
    }

    // Charger les tâches en cours depuis l'API
    try {
      const allTasks = await api.getTasks();
      const inProgress = allTasks
        .filter(t => t.statut === 'en_cours' || t.statut === 'a_faire')
        .slice(0, 5);
      setTasks(inProgress);
    } catch (error) {
      setTasks([]);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Mo';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
  };

  const storagePercent = storageUsed > 0 ? (storageUsed / storageTotal) * 100 : 0;

  return (
    <Layout>
      <div className="dashboard">
        <h1>Tableau de bord</h1>
        <p className="dashboard-subtitle">Bienvenue, {user?.prenom} {user?.nom}</p>

        <div className="dashboard-grid">
          <div className="dashboard-widget">
            <h2>Stockage</h2>
            <div className="widget-storage">
              <div className="storage-circle">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#333"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - storagePercent / 100)}`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="storage-percent">{storagePercent.toFixed(0)}%</div>
              </div>
              <div className="storage-details">
                <p>{formatSize(storageUsed)} utilisés</p>
                <p>{formatSize(storageTotal)} total</p>
              </div>
            </div>
          </div>

          <div className="dashboard-widget">
            <h2>Fichiers récents</h2>
            <div className="widget-list">
              {recentFiles.length > 0 ? (
                recentFiles.map(file => (
                  <div key={file.id} className="widget-item">
                    <span className="widget-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                    <span className="widget-text">{file.nom}</span>
                    <span className="widget-meta">
                      {new Date(file.dateModification).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="widget-empty">Aucun fichier récent</p>
              )}
            </div>
          </div>

          <div className="dashboard-widget">
            <h2>Événements à venir</h2>
            <div className="widget-list">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <div key={event.id} className="widget-item">
                    <span className="widget-icon">📅</span>
                    <div className="widget-content">
                      <span className="widget-text">{event.titre}</span>
                      <span className="widget-meta">
                        {new Date(event.dateDebut).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="widget-empty">Aucun événement à venir</p>
              )}
            </div>
          </div>

          <div className="dashboard-widget">
            <h2>Tâches en cours</h2>
            <div className="widget-list">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <div key={task.id} className="widget-item">
                    <span className="widget-icon">
                      {task.statut === 'termine' ? '✅' : '⏳'}
                    </span>
                    <span className="widget-text">{task.titre}</span>
                    {task.dateEcheance && (
                      <span className="widget-meta">
                        {new Date(task.dateEcheance).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="widget-empty">Aucune tâche</p>
              )}
            </div>
          </div>

          <div className="dashboard-widget">
            <h2>Notifications</h2>
            <div className="widget-list">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div key={notif.id} className="widget-item">
                    <span className="widget-icon">🔔</span>
                    <div className="widget-content">
                      <span className="widget-text">{notif.titre}</span>
                      <span className="widget-meta">{notif.message}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="widget-empty">Aucune notification</p>
              )}
            </div>
          </div>

          <div className="dashboard-widget widget-full">
            <h2>Activité récente</h2>
            <div className="widget-list">
              {activities.length > 0 ? (
                activities.map(activity => (
                  <div key={activity.id} className="widget-item">
                    <span className="widget-icon">📝</span>
                    <div className="widget-content">
                      <span className="widget-text">
                        <strong>{activity.userName || 'Utilisateur inconnu'}</strong> {activity.description}
                      </span>
                      <span className="widget-meta">
                        {new Date(activity.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="widget-empty">Aucune activité récente</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

