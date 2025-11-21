import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { NoteEditor } from '../../components/NoteEditor/NoteEditor';
import './Notes.scss';

export const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNotes();

    // Écouter les événements de synchronisation automatique avec debounce
    let timeoutId;
    let isUpdating = false;
    const handleDataSynced = (e) => {
      if (isUpdating) return;
      const customEvent = e;
      if (customEvent.detail?.key === 'monDrive_notes') {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          try {
            const updated = customEvent.detail.value;
            // Comparer avec l'état actuel pour éviter les re-renders inutiles
            const currentSerialized = JSON.stringify(notes);
            const updatedSerialized = JSON.stringify(updated);
            if (updatedSerialized !== currentSerialized) {
              isUpdating = true;
              setNotes(updated);
              // Si la note sélectionnée a été modifiée, la mettre à jour
              if (selectedNote) {
                const updatedNote = updated.find(n => n.id === selectedNote.id);
                if (updatedNote) {
                  const currentNoteSerialized = JSON.stringify(selectedNote);
                  const updatedNoteSerialized = JSON.stringify(updatedNote);
                  if (updatedNoteSerialized !== currentNoteSerialized) {
                    setSelectedNote(updatedNote);
                  }
                }
              }
              setTimeout(() => { isUpdating = false; }, 100);
            }
          } catch (error) {
            console.error('Erreur lors de la synchronisation des notes:', error);
          }
        }, 200); // Debounce de 200ms
      }
    };

    window.addEventListener('dataSynced', handleDataSynced);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('dataSynced', handleDataSynced);
    };
  }, [notes, selectedNote]); // Dépendances nécessaires pour la comparaison

  const loadNotes = () => {
    try {
      const saved = localStorage.getItem('monDrive_notes');
      if (saved) {
        const loadedNotes = JSON.parse(saved);
        setNotes(loadedNotes);
        if (loadedNotes.length > 0 && !selectedNote) {
          setSelectedNote(loadedNotes[0]);
        }
      } else {
        // Exemples de notes
        const exampleNotes = [
          {
            id: '1',
            titre: 'Réunion équipe - Notes',
            contenu: 'Points abordés :\n- Projet X : avancement à 75%\n- Nouvelle fonctionnalité à développer\n- Deadline : fin du mois\n\nActions :\n- [ ] Préparer la présentation\n- [ ] Contacter le client',
            dateCreation: new Date(Date.now() - 86400000).toISOString(),
            dateModification: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '2',
            titre: 'Idées pour améliorer le produit',
            contenu: 'Liste d\'idées :\n1. Améliorer l\'interface utilisateur\n2. Ajouter des raccourcis clavier\n3. Optimiser les performances\n4. Ajouter le mode sombre',
            dateCreation: new Date(Date.now() - 172800000).toISOString(),
            dateModification: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: '3',
            titre: 'Recette gâteau au chocolat',
            contenu: 'Ingrédients :\n- 200g de chocolat\n- 150g de beurre\n- 3 œufs\n- 100g de sucre\n\nPréparation :\n1. Faire fondre le chocolat...',
            dateCreation: new Date(Date.now() - 259200000).toISOString(),
            dateModification: new Date(Date.now() - 259200000).toISOString(),
          },
        ];
        setNotes(exampleNotes);
        setSelectedNote(exampleNotes[0]);
        localStorage.setItem('monDrive_notes', JSON.stringify(exampleNotes));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const saveNotes = (newNotes) => {
    localStorage.setItem('monDrive_notes', JSON.stringify(newNotes));
    setNotes(newNotes);
  };

  const handleCreateNote = () => {
    const newNote = {
      id: Date.now().toString(),
      titre: 'Nouvelle note',
      contenu: '',
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    saveNotes(updated);
    setSelectedNote(newNote);
  };

  const handleSaveNote = (note) => {
    const updated = notes.map(n => n.id === note.id ? note : n);
    saveNotes(updated);
    setSelectedNote(note);
  };

  const handleDeleteNote = (noteId) => {
    const updated = notes.filter(n => n.id !== noteId);
    saveNotes(updated);
    if (selectedNote?.id === noteId) {
      setSelectedNote(updated.length > 0 ? updated[0] : null);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.contenu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="notes-page">
        <div className="notes-sidebar">
          <div className="notes-header">
            <h1>Notes</h1>
            <button className="btn-primary" onClick={handleCreateNote}>
              + Nouvelle note
            </button>
          </div>
          <div className="notes-search">
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="notes-list">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                onClick={() => setSelectedNote(note)}
              >
                <div className="note-item-title">{note.titre || 'Sans titre'}</div>
                <div className="note-item-preview">
                  {note.contenu.substring(0, 100)}...
                </div>
                <div className="note-item-date">
                  {new Date(note.dateModification).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="notes-editor">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              onSave={handleSaveNote}
              onDelete={() => handleDeleteNote(selectedNote.id)}
            />
          ) : (
            <div className="notes-empty">
              <p>Sélectionnez une note ou créez-en une nouvelle</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

