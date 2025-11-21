import { useState } from 'react';
import './CalendarModal.scss';

export const CalendarModal = ({ event, date, onClose, onSave, onDelete }) => {
  const [titre, setTitre] = useState(event?.titre || '');
  const [description, setDescription] = useState(event?.description || '');
  const [dateDebut, setDateDebut] = useState(
    event?.dateDebut 
      ? new Date(event.dateDebut).toISOString().slice(0, 16)
      : date 
        ? new Date(date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)
  );
  const [dateFin, setDateFin] = useState(
    event?.dateFin 
      ? new Date(event.dateFin).toISOString().slice(0, 16)
      : date
        ? new Date(new Date(date).getTime() + 3600000).toISOString().slice(0, 16)
        : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [lieu, setLieu] = useState(event?.lieu || '');
  const [couleur, setCouleur] = useState(event?.couleur || '#2196f3');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titre.trim()) return;

    const newEvent = {
      id: event?.id || Date.now().toString(),
      titre: titre.trim(),
      description: description.trim() || undefined,
      dateDebut: new Date(dateDebut).toISOString(),
      dateFin: new Date(dateFin).toISOString(),
      lieu: lieu.trim() || undefined,
      couleur,
    };

    onSave(newEvent);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal calendar-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{event ? 'Modifier l\'événement' : 'Nouvel événement'}</h2>
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
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date de début *</label>
              <input
                type="datetime-local"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Date de fin *</label>
              <input
                type="datetime-local"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Lieu</label>
            <input
              type="text"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Couleur</label>
            <div className="color-picker">
              {['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${couleur === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCouleur(color)}
                />
              ))}
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
              {event ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

