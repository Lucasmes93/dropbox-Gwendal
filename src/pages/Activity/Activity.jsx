import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import api from '../../services/api';
import './Activity.scss';

export const Activity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket qui créent des activités
    const unsubscribeFileCreated = onWebSocketEvent('file_created', () => {
      loadActivities();
    });
    const unsubscribeFileUpdated = onWebSocketEvent('file_updated', () => {
      loadActivities();
    });
    const unsubscribeFileDeleted = onWebSocketEvent('file_deleted', () => {
      loadActivities();
    });
    const unsubscribeFileRenamed = onWebSocketEvent('file_renamed', () => {
      loadActivities();
    });
    const unsubscribeFolderCreated = onWebSocketEvent('folder_created', () => {
      loadActivities();
    });

    // Recharger toutes les 10 secondes en fallback
    const interval = setInterval(loadActivities, 10000);
    
    return () => {
      clearInterval(interval);
      unsubscribeFileCreated();
      unsubscribeFileUpdated();
      unsubscribeFileDeleted();
      unsubscribeFileRenamed();
      unsubscribeFolderCreated();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // Charger les activités depuis l'API
      const logs = await api.getActivityLogs();
      
      // Convertir les logs en format d'activité pour l'affichage
      const activitiesFromLogs = logs
        .filter(log => {
          // Filtrer les logs d'utilisateurs supprimés (si userName est "Utilisateur supprimé", on peut les garder pour l'historique admin)
          return log.userName && log.userName !== 'Utilisateur supprimé' || user?.role === 'admin';
        })
        .map(log => ({
          id: log.id,
          type: log.type,
          utilisateur: log.userName || 'Utilisateur inconnu',
          description: log.description,
          timestamp: log.timestamp,
          lien: log.details?.fileId ? `/files` : '/activity',
          details: log.details,
        }));

      setActivities(activitiesFromLogs);
    } catch (error) {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'file_created': return '📄';
      case 'file_modified': return '✏️';
      case 'file_renamed': return '✏️';
      case 'file_deleted': return '🗑️';
      case 'file_restored': return '♻️';
      case 'file_moved': return '📦';
      case 'file_downloaded': return '⬇️';
      case 'file_tagged': return '🏷️';
      case 'file_favorited': return '⭐';
      case 'file_shared': return '🔗';
      case 'folder_created': return '📁';
      case 'calendar_event_created': return '📅';
      case 'calendar_event_updated': return '📅';
      case 'calendar_event_deleted': return '📅';
      case 'note_created': return '📝';
      case 'note_updated': return '📝';
      case 'note_deleted': return '📝';
      case 'task_created': return '✅';
      case 'task_updated': return '✅';
      case 'task_deleted': return '✅';
      case 'board_created': return '📊';
      case 'board_updated': return '📊';
      case 'board_deleted': return '📊';
      case 'contact_created': return '👤';
      case 'contact_updated': return '👤';
      case 'contact_deleted': return '👤';
      default: return '📝';
    }
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter);

  const activityTypes = [
    { value: 'all', label: 'Toutes' },
    { value: 'file_created', label: 'Fichiers créés' },
    { value: 'file_renamed', label: 'Fichiers renommés' },
    { value: 'file_deleted', label: 'Fichiers supprimés' },
    { value: 'file_shared', label: 'Partages' },
    { value: 'calendar_event_created', label: 'Événements' },
    { value: 'task_created', label: 'Tâches' },
  ];

  return (
    <Layout>
      <div className="activity-page">
        <div className="activity-header">
          <h1>Activité</h1>
          <div className="activity-filters">
            {activityTypes.map(type => (
              <button
                key={type.value}
                className={`filter-btn ${filter === type.value ? 'active' : ''}`}
                onClick={() => setFilter(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="activity-timeline">
          {filteredActivities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{getActivityIcon(activity.type)}</div>
              <div className="activity-content">
                <div className="activity-text">
                  <strong>{activity.utilisateur}</strong> {activity.description}
                </div>
                <div className="activity-time">
                  {new Date(activity.timestamp).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="empty-state">Aucune activité</div>
        )}
      </div>
    </Layout>
  );
};

