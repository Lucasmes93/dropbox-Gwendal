import express from 'express';
import { readJSON, writeJSON } from '../utils/storage.js';
import { authenticate } from '../utils/auth.js';
import { enrichUser } from '../utils/enrichUser.js';
import { v4 as uuidv4 } from 'uuid';
import { broadcast } from '../utils/broadcast.js';
import { createActivityLog } from '../utils/activityLogger.js';

const router = express.Router();
router.use(authenticate);
router.use(enrichUser);

// Récupérer toutes les notes de l'utilisateur
router.get('/', (req, res) => {
  try {
    const notes = readJSON('notes.json') || [];
    const userNotes = notes.filter(n => n.userId === req.user.id);
    res.json(userNotes);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une note
router.post('/', (req, res) => {
  try {
    const { titre, contenu } = req.body;

    const notes = readJSON('notes.json') || [];

    const newNote = {
      id: uuidv4(),
      userId: req.user.id,
      titre: titre || 'Nouvelle note',
      contenu: contenu || '',
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString(),
    };

    notes.push(newNote);
    writeJSON('notes.json', notes);

    // Créer un log d'activité
    createActivityLog(req, 'note_created', `a créé la note "${newNote.titre}"`, {
      noteId: newNote.id,
      noteTitle: newNote.titre,
    });

    // Diffuser l'événement
    broadcast({
      type: 'note_created',
      note: newNote,
      userId: req.user.id,
    });

    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour une note
router.patch('/:id', (req, res) => {
  try {
    const { titre, contenu } = req.body;
    const notes = readJSON('notes.json') || [];
    const noteIndex = notes.findIndex(n => n.id === req.params.id);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }

    if (notes[noteIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Mettre à jour
    if (titre !== undefined) notes[noteIndex].titre = titre;
    if (contenu !== undefined) notes[noteIndex].contenu = contenu;
    notes[noteIndex].dateModification = new Date().toISOString();

    writeJSON('notes.json', notes);

    // Créer un log d'activité
    createActivityLog(req, 'note_updated', `a modifié la note "${notes[noteIndex].titre}"`, {
      noteId: notes[noteIndex].id,
      noteTitle: notes[noteIndex].titre,
    });

    // Diffuser l'événement
    broadcast({
      type: 'note_updated',
      note: notes[noteIndex],
      userId: req.user.id,
    });

    res.json(notes[noteIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une note
router.delete('/:id', (req, res) => {
  try {
    const notes = readJSON('notes.json') || [];
    const noteIndex = notes.findIndex(n => n.id === req.params.id);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }

    if (notes[noteIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const deletedNote = notes[noteIndex];
    notes.splice(noteIndex, 1);
    writeJSON('notes.json', notes);

    // Créer un log d'activité
    createActivityLog(req, 'note_deleted', `a supprimé la note "${deletedNote.titre}"`, {
      noteId: deletedNote.id,
      noteTitle: deletedNote.titre,
    });

    // Diffuser l'événement
    broadcast({
      type: 'note_deleted',
      noteId: req.params.id,
      userId: req.user.id,
    });

    res.json({ message: 'Note supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

