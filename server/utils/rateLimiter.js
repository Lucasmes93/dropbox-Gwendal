// Système simple de limitation des tentatives de connexion
// Pour la production, utiliser Redis ou une base de données

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes en millisecondes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

/**
 * Vérifie si une IP est bloquée
 * @param {string} ip - Adresse IP
 * @returns {boolean} - true si bloqué
 */
export function isBlocked(ip) {
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    return false;
  }
  
  // Vérifier si le blocage est encore actif
  if (attempts.blockedUntil && Date.now() < attempts.blockedUntil) {
    return true;
  }
  
  // Le blocage est expiré, réinitialiser
  if (attempts.blockedUntil && Date.now() >= attempts.blockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return false;
}

/**
 * Enregistre une tentative de connexion échouée
 * @param {string} ip - Adresse IP
 * @returns {object} - Informations sur le blocage
 */
export function recordFailedAttempt(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, firstAttempt: now, attempts: [] };
  
  // Nettoyer les anciennes tentatives (hors de la fenêtre)
  attempts.attempts = attempts.attempts.filter(time => now - time < ATTEMPT_WINDOW);
  
  // Ajouter la nouvelle tentative
  attempts.attempts.push(now);
  attempts.count = attempts.attempts.length;
  
  // Si première tentative dans la fenêtre, mettre à jour firstAttempt
  if (attempts.attempts.length === 1) {
    attempts.firstAttempt = now;
  }
  
  // Vérifier si on doit bloquer
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.blockedUntil = now + LOCKOUT_DURATION;
    loginAttempts.set(ip, attempts);
    
    return {
      blocked: true,
      remainingAttempts: 0,
      blockedUntil: attempts.blockedUntil,
      blockedMinutes: Math.ceil(LOCKOUT_DURATION / 60000)
    };
  }
  
  loginAttempts.set(ip, attempts);
  
  return {
    blocked: false,
    remainingAttempts: MAX_ATTEMPTS - attempts.count,
    blockedUntil: null,
    blockedMinutes: 0
  };
}

/**
 * Réinitialise les tentatives pour une IP (après connexion réussie)
 * @param {string} ip - Adresse IP
 */
export function resetAttempts(ip) {
  loginAttempts.delete(ip);
}

/**
 * Obtient le temps restant de blocage en minutes
 * @param {string} ip - Adresse IP
 * @returns {number} - Minutes restantes (0 si pas bloqué)
 */
export function getRemainingBlockTime(ip) {
  const attempts = loginAttempts.get(ip);
  
  if (!attempts || !attempts.blockedUntil) {
    return 0;
  }
  
  const remaining = attempts.blockedUntil - Date.now();
  
  if (remaining <= 0) {
    loginAttempts.delete(ip);
    return 0;
  }
  
  return Math.ceil(remaining / 60000);
}

/**
 * Nettoie les anciennes entrées (à appeler périodiquement)
 */
export function cleanup() {
  const now = Date.now();
  
  for (const [ip, attempts] of loginAttempts.entries()) {
    // Supprimer si le blocage est expiré et aucune tentative récente
    if (attempts.blockedUntil && now >= attempts.blockedUntil) {
      loginAttempts.delete(ip);
    } else if (!attempts.blockedUntil && now - attempts.firstAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(ip);
    }
  }
}

// Nettoyer toutes les 10 minutes
setInterval(cleanup, 10 * 60 * 1000);

