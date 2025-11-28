// Middleware pour enrichir req.user avec les données complètes (nom, prenom)
// À utiliser dans toutes les routes qui nécessitent les informations complètes de l'utilisateur

import { readJSON } from './storage.js';

export const enrichUser = (req, res, next) => {
  try {
    const users = readJSON('users.json') || [];
    const fullUser = users.find(u => u.id === req.user?.id);
    
    if (fullUser) {
      req.user = {
        ...req.user,
        nom: fullUser.nom,
        prenom: fullUser.prenom,
        email: fullUser.email,
      };
    }
    
    next();
  } catch (error) {
    next();
  }
};





