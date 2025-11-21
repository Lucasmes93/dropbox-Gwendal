import { useState } from 'react';
import './TaskModal.scss';

export const TaskModal = ({ task, onClose, onSave, onDelete }) => {
  const [titre, setTitre] = useState(task?.titre || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dateEcheance, setDateEcheance] = useState(
    task?.dateEcheance ? new Date(task.dateEcheance).toISOString().split('T')[0] : ''
  );
  const [priorite, setPriorite] = useState(task?.priorite || 'normale');
  const [statut, setStatut] = useState(task?.statut || 'a_faire');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titre.trim()) return;

    const newTask = {
      id: task?.id || Date.now().toString(),
      titre: titre.trim(),
      description: description.trim() || undefined,
      dateEcheance: dateEcheance ? new Date(dateEcheance).toISOString() : undefined,
      priorite,
      statut,
    };

    onSave(newTask);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date d'échéance</label>
              <input
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Priorité</label>
              <select
                value={priorite}
                onChange={(e) => setPriorite(e.target.value)}
              >
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div className="form-group">
              <label>Statut</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
              >
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminée</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            {onDelete && (
              <button type="button" className="btn-danger" onClick={onDelete}>
                Supprimer
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {task ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

