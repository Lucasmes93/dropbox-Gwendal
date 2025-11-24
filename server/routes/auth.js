import express from 'express';
import { readJSON, writeJSON, initializeData } from '../utils/storage.js';
import { generateToken, hashPassword, comparePassword, verifyToken } from '../utils/auth.js';

const router = express.Router();

// Initialiser les données au démarrage (asynchrone)
initializeData().catch(err => {
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const users = readJSON('users.json') || [];
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    if (user.bloque) {
      return res.status(403).json({ error: 'Votre compte a été bloqué. Contactez un administrateur.' });
    }

    // Vérifier le mot de passe (tous les mots de passe sont hashés)
    if (!user.password) {
      return res.status(401).json({ error: 'Erreur de configuration du compte' });
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Générer le token
    const token = generateToken(user);

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const users = readJSON('users.json') || [];

    // Vérifier si l'email existe déjà
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Créer le nouvel utilisateur
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nom,
      prenom,
      email,
      password: await hashPassword(password),
      role: email.includes('@spirest.fr') ? 'admin' : 'user',
      status: 'offline',
      dateCreation: new Date().toISOString(),
      bloque: false,
    };

    users.push(newUser);
    writeJSON('users.json', users);

    // Synchroniser le nouvel utilisateur vers les contacts
    const { syncNewUserToContacts } = await import('../utils/syncUsersToContacts.js');
    syncNewUserToContacts(newUser);

    // Générer le token
    const token = generateToken(newUser);

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifier le token (pour vérifier si l'utilisateur est toujours connecté)
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  res.json({ valid: true, user: decoded });
});

export default router;

