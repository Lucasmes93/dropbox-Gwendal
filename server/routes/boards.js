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

// Récupérer tous les tableaux de l'utilisateur
router.get('/', (req, res) => {
  try {
    const boards = readJSON('boards.json') || [];
    const userBoards = boards.filter(b => b.userId === req.user.id);
    res.json(userBoards);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un tableau
router.post('/', (req, res) => {
  try {
    const { nom, colonnes } = req.body;

    const boards = readJSON('boards.json') || [];

    const newBoard = {
      id: uuidv4(),
      userId: req.user.id,
      nom: nom || 'Nouveau tableau',
      colonnes: colonnes || [
        { id: uuidv4(), nom: 'À faire', cartes: [], ordre: 0 },
        { id: uuidv4(), nom: 'En cours', cartes: [], ordre: 1 },
        { id: uuidv4(), nom: 'Terminé', cartes: [], ordre: 2 },
      ],
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString(),
    };

    boards.push(newBoard);
    writeJSON('boards.json', boards);

    // Créer un log d'activité
    createActivityLog(req, 'board_created', `a créé le tableau "${newBoard.nom}"`, {
      boardId: newBoard.id,
      boardName: newBoard.nom,
    });

    // Diffuser l'événement
    broadcast({
      type: 'board_created',
      board: newBoard,
      userId: req.user.id,
    });

    res.status(201).json(newBoard);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un tableau
router.patch('/:id', (req, res) => {
  try {
    const { nom, colonnes } = req.body;
    const boards = readJSON('boards.json') || [];
    const boardIndex = boards.findIndex(b => b.id === req.params.id);

    if (boardIndex === -1) {
      return res.status(404).json({ error: 'Tableau non trouvé' });
    }

    if (boards[boardIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Mettre à jour
    if (nom !== undefined) boards[boardIndex].nom = nom;
    if (colonnes !== undefined) boards[boardIndex].colonnes = colonnes;
    boards[boardIndex].dateModification = new Date().toISOString();

    writeJSON('boards.json', boards);

    // Créer un log d'activité
    createActivityLog(req, 'board_updated', `a modifié le tableau "${boards[boardIndex].nom}"`, {
      boardId: boards[boardIndex].id,
      boardName: boards[boardIndex].nom,
    });

    // Diffuser l'événement
    broadcast({
      type: 'board_updated',
      board: boards[boardIndex],
      userId: req.user.id,
    });

    res.json(boards[boardIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un tableau
router.delete('/:id', (req, res) => {
  try {
    const boards = readJSON('boards.json') || [];
    const boardIndex = boards.findIndex(b => b.id === req.params.id);

    if (boardIndex === -1) {
      return res.status(404).json({ error: 'Tableau non trouvé' });
    }

    if (boards[boardIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const deletedBoard = boards[boardIndex];
    boards.splice(boardIndex, 1);
    writeJSON('boards.json', boards);

    // Créer un log d'activité
    createActivityLog(req, 'board_deleted', `a supprimé le tableau "${deletedBoard.nom}"`, {
      boardId: deletedBoard.id,
      boardName: deletedBoard.nom,
    });

    // Diffuser l'événement
    broadcast({
      type: 'board_deleted',
      boardId: req.params.id,
      userId: req.user.id,
    });

    res.json({ message: 'Tableau supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

