import { useState, useEffect } from 'react';
import './NoteEditor.scss';

export const NoteEditor = ({ note, onSave, onDelete }) => {
  const [titre, setTitre] = useState(note.titre);
  const [contenu, setContenu] = useState(note.contenu);

  useEffect(() => {
    setTitre(note.titre);
    setContenu(note.contenu);
  }, [note.id]);

  const handleSave = () => {
    const updated = {
      ...note,
      titre: titre.trim() || 'Sans titre',
      contenu: contenu.trim(),
      dateModification: new Date().toISOString(),
    };
    onSave(updated);
  };

  const handleTitleChange = (newTitle) => {
    setTitre(newTitle);
    clearTimeout(window.noteSaveTimeout);
    window.noteSaveTimeout = setTimeout(() => {
      handleSave();
    }, 1000);
  };

  const handleContentChange = (newContent) => {
    setContenu(newContent);
    clearTimeout(window.noteSaveTimeout);
    window.noteSaveTimeout = setTimeout(() => {
      handleSave();
    }, 1000);
  };

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          type="text"
          className="note-title-input"
          value={titre}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Titre de la note"
        />
        <button className="btn-danger btn-small" onClick={onDelete}>
          Supprimer
        </button>
      </div>
      <div className="note-editor-content">
        <textarea
          className="note-content-textarea"
          value={contenu}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Commencez à écrire..."
        />
      </div>
      <div className="note-editor-footer">
        <span className="note-save-indicator">Enregistré automatiquement</span>
        <span className="note-date">
          Modifié le {new Date(note.dateModification).toLocaleString('fr-FR')}
        </span>
      </div>
    </div>
  );
};

