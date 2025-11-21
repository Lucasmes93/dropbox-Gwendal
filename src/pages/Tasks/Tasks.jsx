import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { TaskModal } from '../../components/TaskModal/TaskModal';
import './Tasks.scss';

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadTasks();

    // Écouter les événements de synchronisation automatique
    const handleDataSynced = (e) => {
      const customEvent = e;
      if (customEvent.detail?.key === 'monDrive_tasks') {
        try {
          const updated = customEvent.detail.value;
          setTasks(updated);
        } catch (error) {
          console.error('Erreur lors de la synchronisation des tâches:', error);
        }
      }
    };

    window.addEventListener('dataSynced', handleDataSynced);
    
    return () => {
      window.removeEventListener('dataSynced', handleDataSynced);
    };
  }, []); // Charger une seule fois au montage

  const loadTasks = () => {
    try {
      const saved = localStorage.getItem('monDrive_tasks');
      if (saved) {
        setTasks(JSON.parse(saved));
      } else {
        // Exemples de tâches
        const exampleTasks = [
          {
            id: '1',
            titre: 'Finaliser le rapport mensuel',
            description: 'Compléter les sections manquantes et vérifier les données',
            statut: 'en_cours',
            priorite: 'haute',
            dateEcheance: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            id: '2',
            titre: 'Préparer la présentation client',
            description: 'Créer les slides pour la réunion de vendredi',
            statut: 'a_faire',
            priorite: 'normale',
            dateEcheance: new Date(Date.now() + 172800000).toISOString(),
          },
          {
            id: '3',
            titre: 'Réviser le code du module X',
            description: 'Vérifier les tests et optimiser les performances',
            statut: 'a_faire',
            priorite: 'basse',
          },
          {
            id: '4',
            titre: 'Répondre aux emails en attente',
            statut: 'a_faire',
            priorite: 'normale',
          },
          {
            id: '5',
            titre: 'Mettre à jour la documentation',
            description: 'Documenter les nouvelles fonctionnalités',
            statut: 'termine',
            priorite: 'normale',
          },
        ];
        setTasks(exampleTasks);
        localStorage.setItem('monDrive_tasks', JSON.stringify(exampleTasks));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const saveTasks = (newTasks) => {
    localStorage.setItem('monDrive_tasks', JSON.stringify(newTasks));
    setTasks(newTasks);
    window.dispatchEvent(new Event('tasksUpdated'));
  };

  const handleSave = (task) => {
    if (selectedTask) {
      saveTasks(tasks.map(t => t.id === selectedTask.id ? task : t));
    } else {
      saveTasks([...tasks, task]);
    }
    setModalOpen(false);
    setSelectedTask(null);
  };

  const handleDelete = (taskId) => {
    saveTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleToggleStatus = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStatus;
    if (task.statut === 'a_faire') newStatus = 'en_cours';
    else if (task.statut === 'en_cours') newStatus = 'termine';
    else newStatus = 'a_faire';

    saveTasks(tasks.map(t => t.id === taskId ? { ...t, statut: newStatus } : t));
  };

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.statut === filter);

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'urgente': return '#f44336';
      case 'haute': return '#ff9800';
      case 'normale': return '#2196f3';
      case 'basse': return '#4caf50';
      default: return '#999';
    }
  };

  return (
    <Layout>
      <div className="tasks-page">
        <div className="tasks-header">
          <h1>Tâches</h1>
          <button className="btn-primary" onClick={() => {
            setSelectedTask(null);
            setModalOpen(true);
          }}>
            + Nouvelle tâche
          </button>
        </div>

        <div className="tasks-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes ({tasks.length})
          </button>
          <button
            className={`filter-btn ${filter === 'a_faire' ? 'active' : ''}`}
            onClick={() => setFilter('a_faire')}
          >
            À faire ({tasks.filter(t => t.statut === 'a_faire').length})
          </button>
          <button
            className={`filter-btn ${filter === 'en_cours' ? 'active' : ''}`}
            onClick={() => setFilter('en_cours')}
          >
            En cours ({tasks.filter(t => t.statut === 'en_cours').length})
          </button>
          <button
            className={`filter-btn ${filter === 'termine' ? 'active' : ''}`}
            onClick={() => setFilter('termine')}
          >
            Terminées ({tasks.filter(t => t.statut === 'termine').length})
          </button>
        </div>

        <div className="tasks-list">
          {filteredTasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <input
                  type="checkbox"
                  checked={task.statut === 'termine'}
                  onChange={() => handleToggleStatus(task.id)}
                  className="task-checkbox"
                />
                <h3 className={task.statut === 'termine' ? 'completed' : ''}>
                  {task.titre}
                </h3>
                <div className="task-priority" style={{ color: getPriorityColor(task.priorite) }}>
                  {task.priorite === 'urgente' && '🔴'}
                  {task.priorite === 'haute' && '🟠'}
                  {task.priorite === 'normale' && '🔵'}
                  {task.priorite === 'basse' && '🟢'}
                </div>
              </div>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              <div className="task-footer">
                {task.dateEcheance && (
                  <span className="task-deadline">
                    📅 {new Date(task.dateEcheance).toLocaleDateString('fr-FR')}
                  </span>
                )}
                <div className="task-actions">
                  <button
                    className="btn-secondary btn-small"
                    onClick={() => {
                      setSelectedTask(task);
                      setModalOpen(true);
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn-danger btn-small"
                    onClick={() => handleDelete(task.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="empty-state">Aucune tâche</div>
        )}

        {modalOpen && (
          <TaskModal
            task={selectedTask}
            onClose={() => {
              setModalOpen(false);
              setSelectedTask(null);
            }}
            onSave={handleSave}
            onDelete={selectedTask ? () => {
              handleDelete(selectedTask.id);
              setModalOpen(false);
              setSelectedTask(null);
            } : undefined}
          />
        )}
      </div>
    </Layout>
  );
};

