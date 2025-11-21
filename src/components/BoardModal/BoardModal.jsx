import { useState } from 'react';
import './BoardModal.scss';

export const BoardModal = ({ board, onClose, onSave, onDelete }) => {
  const [nom, setNom] = useState(board.nom);
  const [description, setDescription] = useState(board.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...board, nom: nom.trim(), description: description.trim() || undefined });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal board-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Modifier le tableau</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom *</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-danger" onClick={onDelete}>
              Supprimer
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

