import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import './Activity.scss';

export const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadActivities();
    // Écouter les nouvelles activités
    const handleActivityUpdate = () => loadActivities();
    window.addEventListener('activityUpdated', handleActivityUpdate);
    return () => window.removeEventListener('activityUpdated', handleActivityUpdate);
  }, []);

  const loadActivities = () => {
    try {
      const saved = localStorage.getItem('monDrive_activities');
      if (saved) {
        const loaded = JSON.parse(saved);
        setActivities(loaded.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } else {
        // Exemples d'activités complètes
        const mockActivities = [
          {
            id: '1',
            type: 'file_created',
            utilisateur: 'Vous',
            description: 'a créé le fichier "rapport_final.pdf"',
            timestamp: new Date().toISOString(),
            lien: '/files',
          },
          {
            id: '2',
            type: 'file_shared',
            utilisateur: 'Marie Dupont',
            description: 'a partagé "presentation.pptx" avec vous',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            lien: '/shared',
          },
          {
            id: '3',
            type: 'file_modified',
            utilisateur: 'Vous',
            description: 'a modifié "budget_2024.xlsx"',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            lien: '/files',
          },
          {
            id: '4',
            type: 'event_created',
            utilisateur: 'Jean Martin',
            description: 'a créé l\'événement "Réunion équipe"',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            lien: '/calendar',
          },
          {
            id: '5',
            type: 'task_completed',
            utilisateur: 'Vous',
            description: 'a terminé la tâche "Finaliser le rapport"',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            lien: '/tasks',
          },
          {
            id: '6',
            type: 'file_created',
            utilisateur: 'Sophie Bernard',
            description: 'a créé le dossier "Projet Alpha"',
            timestamp: new Date(Date.now() - 18000000).toISOString(),
            lien: '/files',
          },
        ];
        setActivities(mockActivities);
        localStorage.setItem('monDrive_activities', JSON.stringify(mockActivities));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'file_created': return '📄';
      case 'file_modified': return '✏️';
      case 'file_shared': return '🔗';
      case 'event_created': return '📅';
      case 'task_completed': return '✅';
      default: return '📝';
    }
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter);

  const activityTypes = [
    { value: 'all', label: 'Toutes' },
    { value: 'file_created', label: 'Fichiers créés' },
    { value: 'file_modified', label: 'Fichiers modifiés' },
    { value: 'file_shared', label: 'Partages' },
    { value: 'event_created', label: 'Événements' },
    { value: 'task_completed', label: 'Tâches' },
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

