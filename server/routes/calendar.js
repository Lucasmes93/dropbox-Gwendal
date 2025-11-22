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

// Récupérer tous les événements de l'utilisateur
router.get('/', (req, res) => {
  try {
    const events = readJSON('calendar.json') || [];
    const userEvents = events.filter(e => e.userId === req.user.id);
    res.json(userEvents);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un événement
router.post('/', (req, res) => {
  try {
    const { titre, description, dateDebut, dateFin, couleur } = req.body;

    if (!titre || !dateDebut) {
      return res.status(400).json({ error: 'Titre et date de début requis' });
    }

    const events = readJSON('calendar.json') || [];

    const newEvent = {
      id: uuidv4(),
      userId: req.user.id,
      titre,
      description: description || '',
      dateDebut,
      dateFin: dateFin || dateDebut,
      couleur: couleur || '#2196f3',
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString(),
    };

    events.push(newEvent);
    writeJSON('calendar.json', events);

    // Créer un log d'activité
    createActivityLog(req, 'calendar_event_created', `a créé l'événement "${newEvent.titre}"`, {
      eventId: newEvent.id,
      eventTitle: newEvent.titre,
      eventDate: newEvent.dateDebut,
    });

    // Diffuser l'événement
    broadcast({
      type: 'calendar_event_created',
      event: newEvent,
      userId: req.user.id,
    });

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un événement
router.patch('/:id', (req, res) => {
  try {
    const { titre, description, dateDebut, dateFin, couleur } = req.body;
    const events = readJSON('calendar.json') || [];
    const eventIndex = events.findIndex(e => e.id === req.params.id);

    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    if (events[eventIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Mettre à jour
    if (titre !== undefined) events[eventIndex].titre = titre;
    if (description !== undefined) events[eventIndex].description = description;
    if (dateDebut !== undefined) events[eventIndex].dateDebut = dateDebut;
    if (dateFin !== undefined) events[eventIndex].dateFin = dateFin;
    if (couleur !== undefined) events[eventIndex].couleur = couleur;
    events[eventIndex].dateModification = new Date().toISOString();

    writeJSON('calendar.json', events);

    // Créer un log d'activité
    createActivityLog(req, 'calendar_event_updated', `a modifié l'événement "${events[eventIndex].titre}"`, {
      eventId: events[eventIndex].id,
      eventTitle: events[eventIndex].titre,
    });

    // Diffuser l'événement
    broadcast({
      type: 'calendar_event_updated',
      event: events[eventIndex],
      userId: req.user.id,
    });

    res.json(events[eventIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un événement
router.delete('/:id', (req, res) => {
  try {
    const events = readJSON('calendar.json') || [];
    const eventIndex = events.findIndex(e => e.id === req.params.id);

    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    if (events[eventIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const deletedEvent = events[eventIndex];
    events.splice(eventIndex, 1);
    writeJSON('calendar.json', events);

    // Créer un log d'activité
    createActivityLog(req, 'calendar_event_deleted', `a supprimé l'événement "${deletedEvent.titre}"`, {
      eventId: deletedEvent.id,
      eventTitle: deletedEvent.titre,
    });

    // Diffuser l'événement
    broadcast({
      type: 'calendar_event_deleted',
      eventId: req.params.id,
      userId: req.user.id,
    });

    res.json({ message: 'Événement supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

