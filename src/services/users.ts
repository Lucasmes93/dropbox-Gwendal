// Service de gestion des utilisateurs et authentification
// Gère les utilisateurs (aucun compte par défaut)

import type { User } from '../types';

const USERS_KEY = 'monDrive_users';
const PASSWORDS_KEY = 'monDrive_passwords'; // Stockage simplifié des mots de passe (en production, utiliser un backend)

// Initialiser les utilisateurs (vide - aucun compte par défaut)
export const initializeUsers = () => {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    const users: User[] = saved ? JSON.parse(saved) : [];
    
    // Ne pas créer de comptes par défaut - le site démarre vide
    if (!saved) {
      localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }

    return users;
  } catch (error) {
    return [];
  }
};

// Récupérer tous les utilisateurs
export const getUsers = (): User[] => {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
};

// Récupérer un utilisateur par email
export const getUserByEmail = (email: string): User | null => {
  const users = getUsers();
  return users.find(u => u.email === email) || null;
};

// Vérifier le mot de passe (simplifié pour le frontend)
export const verifyPassword = (email: string, password: string): boolean => {
  try {
    const saved = localStorage.getItem(PASSWORDS_KEY);
    const passwords: Record<string, string> = saved ? JSON.parse(saved) : {};
    
    // Vérifier le mot de passe stocké
    if (passwords[email]) {
      return passwords[email] === password;
    }

    // Si pas de mot de passe stocké, accepter n'importe quel mot de passe pour la démo
    // (en production, cela devrait être géré par le backend)
    return true;
  } catch (error) {
    return false;
  }
};

// Définir le mot de passe d'un utilisateur
export const setPassword = (email: string, password: string) => {
  try {
    const saved = localStorage.getItem(PASSWORDS_KEY);
    const passwords: Record<string, string> = saved ? JSON.parse(saved) : {};
    passwords[email] = password;
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    return true;
  } catch (error) {
    return false;
  }
};

// Sauvegarder les utilisateurs
export const saveUsers = (users: User[]) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    return false;
  }
};

