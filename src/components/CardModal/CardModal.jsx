import { useState, useEffect } from 'react';
import './CardModal.scss';

export const CardModal = ({ card, board, onClose, onSave, onDelete }) => {
  const [titre, setTitre] = useState(card?.titre || '');
  const [description, setDescription] = useState(card?.description || '');
  const [selectedColumnId, setSelectedColumnId] = useState(card ? null : (board?.colonnes?.[0]?.id || null));

  useEffect(() => {
    if (card) {
      // Si on édite une carte existante, trouver sa colonne
      const column = board?.colonnes?.find(col => 
        col.cartes?.some(c => c.id === card.id)
      );
      if (column) {
        setSelectedColumnId(column.id);
      }
    }
  }, [card, board]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titre.trim()) return;
    
    const cardData = {
      id: card?.id || Date.now().toString(),
      titre: titre.trim(),
      description: description.trim() || undefined,
      ordre: card?.ordre || 0,
    };

    onSave(cardData, selectedColumnId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{card ? 'Modifier la carte' : 'Nouvelle carte'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
              autoFocus
              placeholder="Ex: Créer la maquette"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Description de la tâche..."
            />
          </div>

          {board && board.colonnes && (
            <div className="form-group">
              <label>Statut *</label>
              <select
                value={selectedColumnId || ''}
                onChange={(e) => setSelectedColumnId(e.target.value)}
                required
              >
                {board.colonnes
                  .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
                  .map(column => (
                    <option key={column.id} value={column.id}>
                      {column.nom}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="modal-actions">
            {card && onDelete && (
              <button type="button" className="btn-danger" onClick={onDelete}>
                Supprimer
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {card ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

