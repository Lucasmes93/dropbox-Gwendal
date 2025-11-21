import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
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
  }, []);

  const loadDashboardData = () => {
    // Charger les fichiers récents avec exemples
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles = JSON.parse(saved);
        const recent = allFiles
          .filter(f => !f.estSupprime)
          .sort((a, b) => 
            new Date(b.dateModification).getTime() - new Date(a.dateModification).getTime()
          )
          .slice(0, 5);
        setRecentFiles(recent);

        const totalSize = allFiles
          .filter(f => f.type === 'fichier' && !f.estSupprime && f.taille)
          .reduce((sum, f) => sum + (f.taille || 0), 0);
        setStorageUsed(totalSize);
      } else {
        // Données d'exemple complètes
        const exampleFiles = [
          { id: '1', nom: 'rapport_final.pdf', type: 'fichier', taille: 2048576, dateModification: new Date().toISOString() },
          { id: '2', nom: 'presentation.pptx', type: 'fichier', taille: 5242880, dateModification: new Date(Date.now() - 86400000).toISOString() },
          { id: '3', nom: 'budget_2024.xlsx', type: 'fichier', taille: 1048576, dateModification: new Date(Date.now() - 172800000).toISOString() },
          { id: '4', nom: 'Documents', type: 'dossier', dateModification: new Date(Date.now() - 259200000).toISOString() },
          { id: '5', nom: 'photo_vacances.jpg', type: 'fichier', taille: 3145728, dateModification: new Date(Date.now() - 345600000).toISOString() },
        ];
        setRecentFiles(exampleFiles);
        setStorageUsed(exampleFiles.reduce((sum, f) => sum + (f.taille || 0), 0));
        localStorage.setItem('monDrive_files', JSON.stringify(exampleFiles));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }

    // Charger les événements avec exemples
    try {
      const saved = localStorage.getItem('monDrive_calendar');
      if (saved) {
        const events = JSON.parse(saved);
        const upcoming = events
          .filter(e => new Date(e.dateDebut) >= new Date())
          .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
          .slice(0, 5);
        setUpcomingEvents(upcoming);
      } else {
        const exampleEvents = [
          {
            id: '1',
            titre: 'Réunion équipe',
            dateDebut: new Date(Date.now() + 86400000).toISOString(),
            dateFin: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            couleur: '#2196f3',
          },
          {
            id: '2',
            titre: 'Deadline projet',
            dateDebut: new Date(Date.now() + 172800000).toISOString(),
            dateFin: new Date(Date.now() + 172800000).toISOString(),
            couleur: '#f44336',
          },
          {
            id: '3',
            titre: 'Formation',
            dateDebut: new Date(Date.now() + 259200000).toISOString(),
            dateFin: new Date(Date.now() + 259200000 + 7200000).toISOString(),
            couleur: '#4caf50',
          },
        ];
        setUpcomingEvents(exampleEvents);
        localStorage.setItem('monDrive_calendar', JSON.stringify(exampleEvents));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }

    // Charger les tâches avec exemples
    try {
      const saved = localStorage.getItem('monDrive_tasks');
      if (saved) {
        const allTasks = JSON.parse(saved);
        const activeTasks = allTasks
          .filter(t => t.statut !== 'termine')
          .slice(0, 5);
        setTasks(activeTasks);
      } else {
        const exampleTasks = [
          {
            id: '1',
            titre: 'Finaliser le rapport',
            statut: 'en_cours',
            priorite: 'haute',
            dateEcheance: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            id: '2',
            titre: 'Préparer la présentation',
            statut: 'a_faire',
            priorite: 'normale',
          },
          {
            id: '3',
            titre: 'Réviser le budget',
            statut: 'a_faire',
            priorite: 'basse',
            dateEcheance: new Date(Date.now() + 259200000).toISOString(),
          },
        ];
        setTasks(exampleTasks);
        localStorage.setItem('monDrive_tasks', JSON.stringify(exampleTasks));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }

    // Charger les activités avec exemples
    try {
      const saved = localStorage.getItem('monDrive_activities');
      if (saved) {
        const allActivities = JSON.parse(saved);
        setActivities(allActivities.slice(0, 10));
      } else {
        const exampleActivities = [
          {
            id: '1',
            type: 'file_created',
            utilisateur: 'Vous',
            description: 'a créé le fichier "rapport_final.pdf"',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'file_shared',
            utilisateur: 'Marie Dupont',
            description: 'a partagé "presentation.pptx" avec vous',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '3',
            type: 'event_created',
            utilisateur: 'Vous',
            description: 'a créé l\'événement "Réunion équipe"',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: '4',
            type: 'task_completed',
            utilisateur: 'Vous',
            description: 'a terminé la tâche "Préparer la présentation"',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
          },
        ];
        setActivities(exampleActivities);
        localStorage.setItem('monDrive_activities', JSON.stringify(exampleActivities));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }

    // Charger les notifications avec exemples
    try {
      const saved = localStorage.getItem('monDrive_notifications');
      if (saved) {
        const allNotifications = JSON.parse(saved);
        setNotifications(allNotifications.filter(n => !n.lu).slice(0, 5));
      } else {
        const exampleNotifications = [
          {
            id: '1',
            type: 'file_shared',
            titre: 'Fichier partagé',
            message: 'Marie Dupont a partagé "presentation.pptx" avec vous',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            lu: false,
          },
          {
            id: '2',
            type: 'event_reminder',
            titre: 'Rappel événement',
            message: 'Réunion équipe dans 1 heure',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            lu: false,
          },
          {
            id: '3',
            type: 'task_assigned',
            titre: 'Nouvelle tâche',
            message: 'Une nouvelle tâche vous a été assignée',
            timestamp: new Date(Date.now() - 5400000).toISOString(),
            lu: false,
          },
        ];
        setNotifications(exampleNotifications);
        localStorage.setItem('monDrive_notifications', JSON.stringify(exampleNotifications));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
  };

  const storagePercent = (storageUsed / storageTotal) * 100;

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
                      <span className="widget-text">{activity.description}</span>
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

