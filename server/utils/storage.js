// Système de stockage simple avec fichiers JSON pour la démo

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');

// Créer le dossier data s'il n'existe pas
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = join(DATA_DIR, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Fonction générique pour lire un fichier JSON
export const readJSON = (filename) => {
  const filePath = join(DATA_DIR, filename);
  
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

// Fonction générique pour écrire un fichier JSON
export const writeJSON = (filename, data) => {
  const filePath = join(DATA_DIR, filename);
  
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    return false;
  }
};

// Initialiser les fichiers de données par défaut (vides)
export const initializeData = async () => {
  // Initialiser les utilisateurs avec 3 comptes admin par défaut
  const existingUsers = readJSON('users.json');
  
  if (!existingUsers || existingUsers.length === 0) {
    // Importer les fonctions nécessaires
    const { hashPassword } = await import('./auth.js');
    const { v4: uuidv4 } = await import('uuid');
    
    // Créer 3 comptes admin par défaut
    const defaultAdmins = [
      {
        id: uuidv4(),
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'admin1@spirest.fr',
        password: await hashPassword('Admin123!'),
        role: 'admin',
        status: 'offline',
        dateCreation: new Date().toISOString(),
        bloque: false,
      },
      {
        id: uuidv4(),
        nom: 'Martin',
        prenom: 'Marie',
        email: 'admin2@spirest.fr',
        password: await hashPassword('Admin123!'),
        role: 'admin',
        status: 'offline',
        dateCreation: new Date().toISOString(),
        bloque: false,
      },
      {
        id: uuidv4(),
        nom: 'Bernard',
        prenom: 'Pierre',
        email: 'admin3@spirest.fr',
        password: await hashPassword('Admin123!'),
        role: 'admin',
        status: 'offline',
        dateCreation: new Date().toISOString(),
        bloque: false,
      },
    ];
    
    writeJSON('users.json', defaultAdmins);
  } else {
    // Vérifier si les comptes admin existent déjà
    const adminEmails = ['admin1@spirest.fr', 'admin2@spirest.fr', 'admin3@spirest.fr'];
    const existingAdminEmails = existingUsers
      .filter(u => adminEmails.includes(u.email))
      .map(u => u.email);
    
    if (existingAdminEmails.length < 3) {
    }
  }

  // Initialiser les fichiers (vide)
  if (!readJSON('files.json')) {
    writeJSON('files.json', []);
  }

  // Initialiser les logs d'activité (vide)
  if (!readJSON('activity.json')) {
    writeJSON('activity.json', []);
  }

  // Initialiser les notifications (vide)
  if (!readJSON('notifications.json')) {
    writeJSON('notifications.json', []);
  }

  // Initialiser les nouveaux fichiers de données (vide)
  if (!readJSON('calendar.json')) {
    writeJSON('calendar.json', []);
  }
  if (!readJSON('notes.json')) {
    writeJSON('notes.json', []);
  }
  if (!readJSON('tasks.json')) {
    writeJSON('tasks.json', []);
  }
  if (!readJSON('boards.json')) {
    writeJSON('boards.json', []);
  }
  if (!readJSON('contacts.json')) {
    writeJSON('contacts.json', []);
  }

  // Synchroniser automatiquement les utilisateurs vers les contacts
  const { syncUsersToContacts } = await import('./syncUsersToContacts.js');
  syncUsersToContacts();
};

// Exporter DATA_DIR pour les uploads
export { DATA_DIR };

