import { useState, useEffect } from 'react';
import './RenameModal.scss';

export const RenameModal = ({ item, onClose, onRename }) => {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (item) {
      setNewName(item.nom);
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() && newName.trim() !== item?.nom) {
      onRename(newName.trim());
      onClose();
    }
  };

  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Renommer</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nouveau nom</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Renommer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

