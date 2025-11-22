// Script pour créer les comptes admin par défaut
// Usage: node scripts/create-admin-accounts.js

import { readJSON, writeJSON } from '../utils/storage.js';
import { hashPassword } from '../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';

const createAdminAccounts = async () => {
  try {
    const existingUsers = readJSON('users.json') || [];
    
    // Vérifier si les comptes admin existent déjà
    const adminEmails = ['admin1@spirest.fr', 'admin2@spirest.fr', 'admin3@spirest.fr'];
    const existingAdminEmails = existingUsers
      .filter(u => adminEmails.includes(u.email))
      .map(u => u.email);
    
    if (existingAdminEmails.length === 3) {
      return;
    }
    
    // Créer les comptes admin manquants
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
    
    // Ajouter uniquement les comptes qui n'existent pas
    const newAdmins = defaultAdmins.filter(admin => 
      !existingUsers.some(u => u.email === admin.email)
    );
    
    if (newAdmins.length > 0) {
      const allUsers = [...existingUsers, ...newAdmins];
      writeJSON('users.json', allUsers);
    }
  } catch (error) {
    process.exit(1);
  }
};

createAdminAccounts();

