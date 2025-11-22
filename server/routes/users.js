import express from 'express';
import { readJSON, writeJSON } from '../utils/storage.js';
import { authenticate, isAdmin } from '../utils/auth.js';
import { hashPassword } from '../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { createActivityLog } from '../utils/activityLogger.js';
import { enrichUser } from '../utils/enrichUser.js';

const router = express.Router();

// Tous les routes nécessitent une authentification
router.use(authenticate);
router.use(enrichUser);

// Récupérer tous les utilisateurs (admin uniquement)
router.get('/', isAdmin, (req, res) => {
  try {
    const users = readJSON('users.json') || [];
    
    // Retirer les mots de passe
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un utilisateur par ID
router.get('/:id', (req, res) => {
  try {
    const users = readJSON('users.json') || [];
    const user = users.find(u => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Seul l'admin ou l'utilisateur lui-même peut voir les détails
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un utilisateur (admin uniquement)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const users = readJSON('users.json') || [];

    // Vérifier si l'email existe déjà
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const newUser = {
      id: uuidv4(),
      nom,
      prenom,
      email,
      password: await hashPassword(password),
      role: role || 'user',
      status: 'offline',
      dateCreation: new Date().toISOString(),
      bloque: false,
    };

    users.push(newUser);
    writeJSON('users.json', users);

    // Créer un log d'activité
    createActivityLog(req, 'user_created', `a créé l'utilisateur "${newUser.prenom} ${newUser.nom}"`, {
      userId: newUser.id,
      userName: `${newUser.prenom} ${newUser.nom}`,
      userEmail: newUser.email,
      userRole: newUser.role,
    });

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Bloquer/débloquer un utilisateur (admin uniquement)
router.patch('/:id/block', isAdmin, (req, res) => {
  try {
    const users = readJSON('users.json') || [];
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const wasBlocked = users[userIndex].bloque;
    users[userIndex].bloque = !users[userIndex].bloque;
    writeJSON('users.json', users);

    // Créer un log d'activité
    createActivityLog(req, 'user_blocked', wasBlocked 
      ? `a débloqué l'utilisateur "${users[userIndex].prenom} ${users[userIndex].nom}"`
      : `a bloqué l'utilisateur "${users[userIndex].prenom} ${users[userIndex].nom}"`, {
      userId: users[userIndex].id,
      userName: `${users[userIndex].prenom} ${users[userIndex].nom}`,
      blocked: !wasBlocked,
    });

    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Réinitialiser le mot de passe (admin uniquement)
router.post('/:id/reset-password', isAdmin, async (req, res) => {
  try {
    const users = readJSON('users.json') || [];
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Générer un nouveau mot de passe temporaire
    const tempPassword = Math.random().toString(36).substring(2, 10) + 
                         Math.random().toString(36).substring(2, 10).toUpperCase();
    
    users[userIndex].password = await hashPassword(tempPassword);
    writeJSON('users.json', users);

    // Créer un log d'activité
    createActivityLog(req, 'user_password_reset', `a réinitialisé le mot de passe de "${users[userIndex].prenom} ${users[userIndex].nom}"`, {
      userId: users[userIndex].id,
      userName: `${users[userIndex].prenom} ${users[userIndex].nom}`,
    });

    res.json({ 
      message: 'Mot de passe réinitialisé',
      tempPassword // En production, envoyer par email
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le profil de l'utilisateur (lui-même ou admin)
router.patch('/:id', async (req, res) => {
  try {
    const users = readJSON('users.json') || [];
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier les permissions : l'utilisateur peut modifier son propre profil ou admin peut modifier n'importe qui
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { nom, prenom, email, status, role } = req.body;

    // Mettre à jour les champs fournis
    if (nom !== undefined) users[userIndex].nom = nom;
    if (prenom !== undefined) users[userIndex].prenom = prenom;
    if (email !== undefined) {
      // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
      const emailExists = users.some((u, idx) => u.email === email && idx !== userIndex);
      if (emailExists) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
      users[userIndex].email = email;
    }
    if (status !== undefined) users[userIndex].status = status;
    
    // Gestion du changement de rôle (admin uniquement)
    if (role !== undefined && req.user.role === 'admin') {
      const oldRole = users[userIndex].role;
      
      // Si on retire le rôle admin, vérifier qu'il reste au moins un admin
      if (oldRole === 'admin' && role === 'user') {
        const adminCount = users.filter(u => u.role === 'admin' && u.id !== users[userIndex].id).length;
        if (adminCount === 0) {
          return res.status(400).json({ error: 'Impossible de retirer le rôle admin : il doit rester au moins un administrateur' });
        }
      }
      
      users[userIndex].role = role;
    }

    writeJSON('users.json', users);

    // Créer un log d'activité
    const updatedFields = [];
    if (nom !== undefined) updatedFields.push('nom');
    if (prenom !== undefined) updatedFields.push('prénom');
    if (email !== undefined) updatedFields.push('email');
    if (status !== undefined) updatedFields.push('statut');
    if (role !== undefined && req.user.role === 'admin') {
      const roleLabel = role === 'admin' ? 'administrateur' : 'utilisateur';
      updatedFields.push(`rôle (${roleLabel})`);
    }
    
    if (updatedFields.length > 0) {
      createActivityLog(req, 'user_updated', `a modifié le profil de "${users[userIndex].prenom} ${users[userIndex].nom}" (${updatedFields.join(', ')})`, {
        userId: users[userIndex].id,
        userName: `${users[userIndex].prenom} ${users[userIndex].nom}`,
        updatedFields,
      });
    }

    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur (admin uniquement) - Suppression complète
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const users = readJSON('users.json') || [];
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const userToDelete = users[userIndex];
    const userId = userToDelete.id;

    // Empêcher la suppression de soi-même
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Empêcher la suppression du dernier admin
    if (userToDelete.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin' && u.id !== userId).length;
      if (adminCount === 0) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
      }
    }

    // 1. Supprimer tous les fichiers de l'utilisateur (physiquement et dans la base)
    const files = readJSON('files.json') || [];
    const userFiles = files.filter(f => f.proprietaireId === userId);
    
    // Supprimer les fichiers physiques
    const { join } = await import('path');
    const { existsSync, unlinkSync } = await import('fs');
    const { DATA_DIR } = await import('../utils/storage.js');
    
    userFiles.forEach(file => {
      if (file.type === 'fichier' && file.filePath) {
        const filePath = join(DATA_DIR, 'uploads', file.filePath);
        if (existsSync(filePath)) {
          try {
            unlinkSync(filePath);
          } catch (error) {
          }
        }
      }
    });

    // Supprimer les fichiers de la base ET nettoyer les permissions
    const remainingFiles = files
      .filter(f => f.proprietaireId !== userId)
      .map(file => {
        // Nettoyer les permissions : supprimer les références à l'utilisateur supprimé
        if (file.permissions && file.permissions[userId]) {
          const cleanedPermissions = { ...file.permissions };
          delete cleanedPermissions[userId];
          return { ...file, permissions: cleanedPermissions };
        }
        return file;
      });
    writeJSON('files.json', remainingFiles);

    // 2. Supprimer tous les logs d'activité de l'utilisateur
    // Note: On supprime complètement les logs de l'utilisateur pour qu'il n'apparaisse plus nulle part
    const activities = readJSON('activity.json') || [];
    const cleanedActivities = activities.filter(a => a.userId !== userId);
    writeJSON('activity.json', cleanedActivities);

    // 3. Supprimer toutes les notifications de l'utilisateur ET celles qui le mentionnent
    const notifications = readJSON('notifications.json') || [];
    const cleanedNotifications = notifications
      .filter(n => {
        // Supprimer les notifications de l'utilisateur
        if (n.userId === userId) return false;
        // Supprimer les notifications qui mentionnent l'utilisateur dans le message
        if (n.message && n.message.includes(`${userToDelete.prenom} ${userToDelete.nom}`)) {
          return false;
        }
        if (n.titre && n.titre.includes(`${userToDelete.prenom} ${userToDelete.nom}`)) {
          return false;
        }
        return true;
      });
    writeJSON('notifications.json', cleanedNotifications);

    // 4. Supprimer tous les événements du calendrier de l'utilisateur
    const calendarEvents = readJSON('calendar.json') || [];
    const remainingEvents = calendarEvents.filter(e => e.userId !== userId);
    // Nettoyer les références dans les événements restants (participants, etc.)
    const finalEvents = remainingEvents.map(event => {
      // Si l'événement a des participants, supprimer l'utilisateur
      if (event.participants && Array.isArray(event.participants)) {
        return {
          ...event,
          participants: event.participants.filter(p => p !== userId && p.id !== userId),
        };
      }
      return event;
    });
    writeJSON('calendar.json', finalEvents);

    // 5. Supprimer toutes les notes de l'utilisateur
    const notes = readJSON('notes.json') || [];
    const remainingNotes = notes.filter(n => n.userId !== userId);
    writeJSON('notes.json', remainingNotes);

    // 6. Supprimer toutes les tâches de l'utilisateur ET nettoyer les références
    const tasks = readJSON('tasks.json') || [];
    const remainingTasks = tasks.filter(t => t.userId !== userId);
    // Nettoyer les références dans les tâches restantes (assigné à, etc.)
    const finalTasks = remainingTasks.map(task => {
      // Si la tâche est assignée à l'utilisateur, la désassigner
      if (task.assigneeId === userId) {
        return {
          ...task,
          assigneeId: null,
        };
      }
      return task;
    });
    writeJSON('tasks.json', finalTasks);

    // 7. Supprimer tous les tableaux de l'utilisateur ET nettoyer les références
    const boards = readJSON('boards.json') || [];
    const remainingBoards = boards.filter(b => b.userId !== userId);
    // Nettoyer les références dans les tableaux restants (membres, etc.)
    const finalBoards = remainingBoards.map(board => {
      // Si le tableau a des membres, supprimer l'utilisateur
      if (board.membres && Array.isArray(board.membres)) {
        return {
          ...board,
          membres: board.membres.filter(m => m !== userId && m.id !== userId),
        };
      }
      return board;
    });
    writeJSON('boards.json', finalBoards);

    // 8. Supprimer tous les contacts de l'utilisateur
    const contacts = readJSON('contacts.json') || [];
    const remainingContacts = contacts.filter(c => c.userId !== userId);
    writeJSON('contacts.json', remainingContacts);

    // 12. Supprimer l'utilisateur
    users.splice(userIndex, 1);
    writeJSON('users.json', users);

    // Créer un log d'activité (avant de supprimer les logs de l'utilisateur)
    createActivityLog(req, 'user_deleted', `a supprimé l'utilisateur "${userToDelete.prenom} ${userToDelete.nom}" et toutes ses données`, {
      deletedUserId: userId,
      deletedUserName: `${userToDelete.prenom} ${userToDelete.nom}`,
    });

    res.json({ 
      message: 'Utilisateur et toutes ses données supprimés avec succès',
      deletedUser: {
        id: userId,
        nom: userToDelete.nom,
        prenom: userToDelete.prenom,
        email: userToDelete.email,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changer le mot de passe de l'utilisateur
router.patch('/:id/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const users = readJSON('users.json') || [];
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier les permissions
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier l'ancien mot de passe
    const { comparePassword } = await import('../utils/auth.js');
    const passwordMatch = await comparePassword(oldPassword, users[userIndex].password);
    
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Ancien mot de passe incorrect' });
    }

    // Mettre à jour le mot de passe
    users[userIndex].password = await hashPassword(newPassword);
    writeJSON('users.json', users);

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

