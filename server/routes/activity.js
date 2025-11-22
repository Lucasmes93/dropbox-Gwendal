import express from 'express';
import { readJSON, writeJSON } from '../utils/storage.js';
import { authenticate } from '../utils/auth.js';
import { enrichUser } from '../utils/enrichUser.js';

// Import pour vérifier les utilisateurs existants
const checkUsersExist = () => {
  const users = readJSON('users.json') || [];
  return new Set(users.map(u => u.id));
};

const router = express.Router();
router.use(authenticate);
router.use(enrichUser);

// Récupérer les logs d'activité
router.get('/', (req, res) => {
  try {
    const logs = readJSON('activity.json') || [];
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Vérifier que les utilisateurs référencés existent encore
    const existingUserIds = checkUsersExist();

    // Filtrer selon les permissions et vérifier que les utilisateurs existent
    const userLogs = logs.filter(log => {
      // Si le log référence un utilisateur qui n'existe plus, le masquer (sauf pour les admins qui voient tout)
      if (!isAdmin && log.userId && !existingUserIds.has(log.userId)) {
        return false;
      }
      
      if (isAdmin) return true;
      if (log.userId === userId) return true;
      if (log.accessibleBy?.includes(userId)) return true;
      if (log.accessibleBy?.includes('public')) return true;
      return false;
    });

    // Trier par date (plus récent en premier)
    userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(userLogs);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un log d'activité
router.post('/', (req, res) => {
  try {
    const { type, description, details } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: 'Type et description requis' });
    }

    const logs = readJSON('activity.json') || [];

    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId: req.user.id,
      userName: `${req.user.prenom} ${req.user.nom}`,
      description,
      timestamp: new Date().toISOString(),
      details: details || {},
      accessibleBy: req.body.accessibleBy || ['admin'],
    };

    logs.push(newLog);

    // Garder seulement les 1000 derniers logs
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    writeJSON('activity.json', logs);

    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

