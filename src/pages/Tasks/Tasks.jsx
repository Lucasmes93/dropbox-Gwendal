import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { TaskModal } from '../../components/TaskModal/TaskModal';
import { useAuth } from '../../context/AuthContext';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import api from '../../services/api';
import './Tasks.scss';

export const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();

    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket
    const unsubscribeTaskCreated = onWebSocketEvent('task_created', () => {
      loadTasks();
    });
    const unsubscribeTaskUpdated = onWebSocketEvent('task_updated', () => {
      loadTasks();
    });
    const unsubscribeTaskDeleted = onWebSocketEvent('task_deleted', () => {
      loadTasks();
    });

    // Recharger toutes les 10 secondes en fallback
    const interval = setInterval(loadTasks, 10000);

    return () => {
      clearInterval(interval);
      unsubscribeTaskCreated();
      unsubscribeTaskUpdated();
      unsubscribeTaskDeleted();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const loadedTasks = await api.getTasks();
      setTasks(loadedTasks);
    } catch (error) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (task) => {
    try {
      if (selectedTask) {
        await api.updateTask(selectedTask.id, {
          titre: task.titre,
          description: task.description,
          statut: task.statut,
          priorite: task.priorite,
          dateEcheance: task.dateEcheance,
        });
      } else {
        await api.createTask({
          titre: task.titre,
          description: task.description,
          statut: task.statut,
          priorite: task.priorite,
          dateEcheance: task.dateEcheance,
        });
      }
      await loadTasks();
      setModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      alert('Erreur lors de la sauvegarde: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      alert('Erreur lors de la suppression: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleToggleStatus = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      let newStatus;
      if (task.statut === 'a_faire') newStatus = 'en_cours';
      else if (task.statut === 'en_cours') newStatus = 'termine';
      else newStatus = 'a_faire';

      await api.updateTask(taskId, { statut: newStatus });
      await loadTasks();
    } catch (error) {
    }
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

