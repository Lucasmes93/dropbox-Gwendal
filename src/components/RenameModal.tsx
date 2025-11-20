import { useState, FormEvent } from 'react';
import type { FileItem } from '../types';
import '../styles/Modal.css';

interface RenameModalProps {
  item: FileItem;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export const RenameModal = ({ item, onClose, onRename }: RenameModalProps) => {
  const [nom, setNom] = useState(item.nom);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError('Le nom est requis');
      return;
    }
    onRename(nom.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <h2>Renommer</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="itemName">Nouveau nom</label>
            <input
              type="text"
              id="itemName"
              value={nom}
              onChange={(e) => {
                setNom(e.target.value);
                setError('');
              }}
              autoFocus
            />
            {error && <span className="field-error">{error}</span>}
          </div>

          <div className="modal-actions">
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

