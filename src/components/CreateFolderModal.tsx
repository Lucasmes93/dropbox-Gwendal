import { useState, FormEvent } from 'react';
import '../styles/Modal.css';

interface CreateFolderModalProps {
  onClose: () => void;
  onCreate: (nom: string) => void;
}

export const CreateFolderModal = ({ onClose, onCreate }: CreateFolderModalProps) => {
  const [nom, setNom] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError('Le nom du dossier est requis');
      return;
    }
    onCreate(nom.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <h2>Nouveau dossier</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="folderName">Nom du dossier</label>
            <input
              type="text"
              id="folderName"
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
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

