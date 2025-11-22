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

// Récupérer toutes les tâches de l'utilisateur
router.get('/', (req, res) => {
  try {
    const tasks = readJSON('tasks.json') || [];
    const userTasks = tasks.filter(t => t.userId === req.user.id);
    res.json(userTasks);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une tâche
router.post('/', (req, res) => {
  try {
    const { titre, description, statut, priorite, dateEcheance } = req.body;

    if (!titre) {
      return res.status(400).json({ error: 'Titre requis' });
    }

    const tasks = readJSON('tasks.json') || [];

    const newTask = {
      id: uuidv4(),
      userId: req.user.id,
      titre,
      description: description || '',
      statut: statut || 'a_faire',
      priorite: priorite || 'normale',
      dateEcheance: dateEcheance || null,
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString(),
    };

    tasks.push(newTask);
    writeJSON('tasks.json', tasks);

    // Créer un log d'activité
    createActivityLog(req, 'task_created', `a créé la tâche "${newTask.titre}"`, {
      taskId: newTask.id,
      taskTitle: newTask.titre,
      taskStatus: newTask.statut,
      taskPriority: newTask.priorite,
    });

    // Diffuser l'événement
    broadcast({
      type: 'task_created',
      task: newTask,
      userId: req.user.id,
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour une tâche
router.patch('/:id', (req, res) => {
  try {
    const { titre, description, statut, priorite, dateEcheance } = req.body;
    const tasks = readJSON('tasks.json') || [];
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    if (tasks[taskIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Mettre à jour
    if (titre !== undefined) tasks[taskIndex].titre = titre;
    if (description !== undefined) tasks[taskIndex].description = description;
    if (statut !== undefined) tasks[taskIndex].statut = statut;
    if (priorite !== undefined) tasks[taskIndex].priorite = priorite;
    if (dateEcheance !== undefined) tasks[taskIndex].dateEcheance = dateEcheance;
    tasks[taskIndex].dateModification = new Date().toISOString();

    writeJSON('tasks.json', tasks);

    // Créer un log d'activité
    const statusChange = statut !== undefined && tasks[taskIndex].statut !== statut
      ? ` (statut: ${tasks[taskIndex].statut} → ${statut})`
      : '';
    createActivityLog(req, 'task_updated', `a modifié la tâche "${tasks[taskIndex].titre}"${statusChange}`, {
      taskId: tasks[taskIndex].id,
      taskTitle: tasks[taskIndex].titre,
      taskStatus: tasks[taskIndex].statut,
    });

    // Diffuser l'événement
    broadcast({
      type: 'task_updated',
      task: tasks[taskIndex],
      userId: req.user.id,
    });

    res.json(tasks[taskIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une tâche
router.delete('/:id', (req, res) => {
  try {
    const tasks = readJSON('tasks.json') || [];
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    if (tasks[taskIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    writeJSON('tasks.json', tasks);

    // Créer un log d'activité
    createActivityLog(req, 'task_deleted', `a supprimé la tâche "${deletedTask.titre}"`, {
      taskId: deletedTask.id,
      taskTitle: deletedTask.titre,
    });

    // Diffuser l'événement
    broadcast({
      type: 'task_deleted',
      taskId: req.params.id,
      userId: req.user.id,
    });

    res.json({ message: 'Tâche supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

