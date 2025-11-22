// Utilitaire pour créer automatiquement des logs d'activité
import { readJSON, writeJSON } from './storage.js';

export const createActivityLog = (req, type, description, details = {}) => {
  try {
    const logs = readJSON('activity.json') || [];
    
    const userName = req.user?.prenom && req.user?.nom 
      ? `${req.user.prenom} ${req.user.nom}`
      : req.user?.email || 'Utilisateur inconnu';

    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId: req.user?.id,
      userName,
      description,
      timestamp: new Date().toISOString(),
      details: details || {},
      accessibleBy: ['admin', req.user?.id].filter(Boolean),
    };

    logs.push(newLog);

    // Garder seulement les 1000 derniers logs
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    writeJSON('activity.json', logs);
    
    return newLog;
  } catch (error) {
    return null;
  }
};

