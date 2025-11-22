import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { NoteEditor } from '../../components/NoteEditor/NoteEditor';
import { useAuth } from '../../context/AuthContext';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import api from '../../services/api';
import './Notes.scss';

export const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();

    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket
    const unsubscribeNoteCreated = onWebSocketEvent('note_created', () => {
      loadNotes();
    });
    const unsubscribeNoteUpdated = onWebSocketEvent('note_updated', () => {
      loadNotes();
    });
    const unsubscribeNoteDeleted = onWebSocketEvent('note_deleted', () => {
      loadNotes();
    });

    // Recharger toutes les 10 secondes en fallback
    const interval = setInterval(loadNotes, 10000);

    return () => {
      clearInterval(interval);
      unsubscribeNoteCreated();
      unsubscribeNoteUpdated();
      unsubscribeNoteDeleted();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const loadedNotes = await api.getNotes();
      setNotes(loadedNotes);
      if (loadedNotes.length > 0 && !selectedNote) {
        setSelectedNote(loadedNotes[0]);
      } else if (selectedNote) {
        const updatedNote = loadedNotes.find(n => n.id === selectedNote.id);
        if (updatedNote) {
          setSelectedNote(updatedNote);
        } else if (loadedNotes.length > 0) {
          setSelectedNote(loadedNotes[0]);
        } else {
          setSelectedNote(null);
        }
      }
    } catch (error) {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await api.createNote({
        titre: 'Nouvelle note',
        contenu: '',
      });
      await loadNotes();
      setSelectedNote(newNote);
    } catch (error) {
      alert('Erreur lors de la création: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleSaveNote = async (note) => {
    try {
      await api.updateNote(note.id, {
        titre: note.titre,
        contenu: note.contenu,
      });
      await loadNotes();
    } catch (error) {
      alert('Erreur lors de la sauvegarde: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.deleteNote(noteId);
      await loadNotes();
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      alert('Erreur lors de la suppression: ' + (error?.message || 'Erreur serveur'));
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

