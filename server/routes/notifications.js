import express from 'express';
import { readJSON, writeJSON } from '../utils/storage.js';
import { authenticate } from '../utils/auth.js';
import { enrichUser } from '../utils/enrichUser.js';
import { broadcast } from '../utils/broadcast.js';

const router = express.Router();
router.use(authenticate);
router.use(enrichUser);

// Récupérer les notifications de l'utilisateur
router.get('/', (req, res) => {
  try {
    const notifications = readJSON('notifications.json') || [];
    const userNotifications = notifications.filter(n => n.userId === req.user.id);

    // Trier par date (plus récent en premier)
    userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(userNotifications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une notification
router.post('/', (req, res) => {
  try {
    const { type, titre, message, errorCause, actionType } = req.body;

    if (!type || !titre || !message) {
      return res.status(400).json({ error: 'Type, titre et message requis' });
    }

    const notifications = readJSON('notifications.json') || [];

    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      type,
      titre,
      message,
      timestamp: new Date().toISOString(),
      lu: false,
      errorCause,
      actionType,
    };

    notifications.push(newNotification);

    // Garder seulement les 500 dernières notifications
    if (notifications.length > 500) {
      notifications.splice(0, notifications.length - 500);
    }

    writeJSON('notifications.json', notifications);

    // Diffuser l'événement à tous les clients connectés
    broadcast({
      type: 'notification_created',
      notification: newNotification,
    });

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer une notification comme lue
router.patch('/:id/read', (req, res) => {
  try {
    const notifications = readJSON('notifications.json') || [];
    const notificationIndex = notifications.findIndex(n => n.id === req.params.id);

    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    if (notifications[notificationIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    notifications[notificationIndex].lu = true;
    writeJSON('notifications.json', notifications);

    // Diffuser l'événement
    broadcast({
      type: 'notification_updated',
      notification: notifications[notificationIndex],
    });

    res.json(notifications[notificationIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une notification
router.delete('/:id', (req, res) => {
  try {
    const notifications = readJSON('notifications.json') || [];
    const notificationIndex = notifications.findIndex(n => n.id === req.params.id);

    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    if (notifications[notificationIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    notifications.splice(notificationIndex, 1);
    writeJSON('notifications.json', notifications);

    // Diffuser l'événement
    broadcast({
      type: 'notification_deleted',
      notificationId: req.params.id,
    });

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

