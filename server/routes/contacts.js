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

// Récupérer tous les contacts de l'utilisateur
router.get('/', (req, res) => {
  try {
    const contacts = readJSON('contacts.json') || [];
    const userContacts = contacts.filter(c => c.userId === req.user.id);
    res.json(userContacts);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un contact
router.post('/', (req, res) => {
  try {
    const { nom, prenom, email, telephone, entreprise, notes } = req.body;

    if (!nom || !email) {
      return res.status(400).json({ error: 'Nom et email requis' });
    }

    const contacts = readJSON('contacts.json') || [];

    const newContact = {
      id: uuidv4(),
      userId: req.user.id,
      nom,
      prenom: prenom || '',
      email,
      telephone: telephone || '',
      entreprise: entreprise || '',
      notes: notes || '',
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString(),
    };

    contacts.push(newContact);
    writeJSON('contacts.json', contacts);

    // Créer un log d'activité
    createActivityLog(req, 'contact_created', `a créé le contact "${newContact.prenom} ${newContact.nom}"`, {
      contactId: newContact.id,
      contactName: `${newContact.prenom} ${newContact.nom}`,
      contactEmail: newContact.email,
    });

    // Diffuser l'événement
    broadcast({
      type: 'contact_created',
      contact: newContact,
      userId: req.user.id,
    });

    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un contact
router.patch('/:id', (req, res) => {
  try {
    const { nom, prenom, email, telephone, entreprise, notes } = req.body;
    const contacts = readJSON('contacts.json') || [];
    const contactIndex = contacts.findIndex(c => c.id === req.params.id);

    if (contactIndex === -1) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    if (contacts[contactIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Mettre à jour
    if (nom !== undefined) contacts[contactIndex].nom = nom;
    if (prenom !== undefined) contacts[contactIndex].prenom = prenom;
    if (email !== undefined) contacts[contactIndex].email = email;
    if (telephone !== undefined) contacts[contactIndex].telephone = telephone;
    if (entreprise !== undefined) contacts[contactIndex].entreprise = entreprise;
    if (notes !== undefined) contacts[contactIndex].notes = notes;
    contacts[contactIndex].dateModification = new Date().toISOString();

    writeJSON('contacts.json', contacts);

    // Créer un log d'activité
    createActivityLog(req, 'contact_updated', `a modifié le contact "${contacts[contactIndex].prenom} ${contacts[contactIndex].nom}"`, {
      contactId: contacts[contactIndex].id,
      contactName: `${contacts[contactIndex].prenom} ${contacts[contactIndex].nom}`,
    });

    // Diffuser l'événement
    broadcast({
      type: 'contact_updated',
      contact: contacts[contactIndex],
      userId: req.user.id,
    });

    res.json(contacts[contactIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un contact
router.delete('/:id', (req, res) => {
  try {
    const contacts = readJSON('contacts.json') || [];
    const contactIndex = contacts.findIndex(c => c.id === req.params.id);

    if (contactIndex === -1) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    if (contacts[contactIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const deletedContact = contacts[contactIndex];
    contacts.splice(contactIndex, 1);
    writeJSON('contacts.json', contacts);

    // Créer un log d'activité
    createActivityLog(req, 'contact_deleted', `a supprimé le contact "${deletedContact.prenom} ${deletedContact.nom}"`, {
      contactId: deletedContact.id,
      contactName: `${deletedContact.prenom} ${deletedContact.nom}`,
    });

    // Diffuser l'événement
    broadcast({
      type: 'contact_deleted',
      contactId: req.params.id,
      userId: req.user.id,
    });

    res.json({ message: 'Contact supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

