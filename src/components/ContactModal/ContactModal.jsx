import { useState } from 'react';
import './ContactModal.scss';

export const ContactModal = ({ contact, onClose, onSave, onDelete }) => {
  const [prenom, setPrenom] = useState(contact?.prenom || '');
  const [nom, setNom] = useState(contact?.nom || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [telephone, setTelephone] = useState(contact?.telephone || '');
  const [entreprise, setEntreprise] = useState(contact?.entreprise || '');
  const [poste, setPoste] = useState(contact?.poste || '');
  const [adresse, setAdresse] = useState(contact?.adresse || '');
  const [notes, setNotes] = useState(contact?.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim()) return;

    const newContact = {
      id: contact?.id || Date.now().toString(),
      prenom: prenom.trim(),
      nom: nom.trim(),
      email: email.trim() || undefined,
      telephone: telephone.trim() || undefined,
      entreprise: entreprise.trim() || undefined,
      poste: poste.trim() || undefined,
      adresse: adresse.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(newContact);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal contact-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{contact ? 'Modifier le contact' : 'Nouveau contact'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Entreprise</label>
              <input
                type="text"
                value={entreprise}
                onChange={(e) => setEntreprise(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Poste</label>
              <input
                type="text"
                value={poste}
                onChange={(e) => setPoste(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <input
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
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
              {contact ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

