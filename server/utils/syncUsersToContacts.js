// Fonction pour synchroniser automatiquement les utilisateurs vers les contacts
import { readJSON, writeJSON } from './storage.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Synchronise tous les utilisateurs vers les contacts
 * Chaque utilisateur aura tous les autres utilisateurs dans sa liste de contacts
 * (sauf lui-même)
 */
export const syncUsersToContacts = () => {
  try {
    const users = readJSON('users.json') || [];
    const contacts = readJSON('contacts.json') || [];
    
    // Pour chaque utilisateur, s'assurer qu'il a tous les autres utilisateurs dans ses contacts
    users.forEach(user => {
      // Trouver tous les contacts existants pour cet utilisateur
      const userContacts = contacts.filter(c => c.userId === user.id);
      
      // Pour chaque autre utilisateur, créer ou mettre à jour le contact
      users.forEach(otherUser => {
        // Ne pas créer de contact pour soi-même
        if (otherUser.id === user.id) {
          return;
        }
        
        // Vérifier si un contact existe déjà pour cet utilisateur (par email)
        const existingContactIndex = contacts.findIndex(
          c => c.userId === user.id && c.email === otherUser.email
        );
        
        if (existingContactIndex !== -1) {
          // Mettre à jour le contact existant avec les dernières informations
          contacts[existingContactIndex] = {
            ...contacts[existingContactIndex],
            nom: otherUser.nom,
            prenom: otherUser.prenom,
            email: otherUser.email,
            telephone: contacts[existingContactIndex].telephone || '', // Conserver le téléphone si existant
            dateModification: new Date().toISOString(),
          };
        } else {
          // Créer un nouveau contact
          const newContact = {
            id: uuidv4(),
            userId: user.id,
            nom: otherUser.nom,
            prenom: otherUser.prenom,
            email: otherUser.email,
            telephone: '', // Les utilisateurs n'ont pas de téléphone par défaut
            entreprise: '',
            notes: '',
            dateCreation: new Date().toISOString(),
            dateModification: new Date().toISOString(),
            syncedFromUser: true, // Marquer comme synchronisé depuis les utilisateurs
          };
          
          contacts.push(newContact);
        }
      });
    });
    
    // Supprimer les contacts qui correspondent à des utilisateurs supprimés
    // (mais seulement ceux qui ont été synchronisés automatiquement)
    const userIds = new Set(users.map(u => u.id));
    const userEmails = new Set(users.map(u => u.email));
    
    const cleanedContacts = contacts.filter(contact => {
      // Garder les contacts qui :
      // 1. Ne sont pas synchronisés automatiquement (créés manuellement)
      // 2. Ou correspondent à un utilisateur existant
      if (!contact.syncedFromUser) {
        return true; // Garder les contacts créés manuellement
      }
      
      // Pour les contacts synchronisés, vérifier que l'utilisateur existe toujours
      // On vérifie par email car c'est l'identifiant unique
      return userEmails.has(contact.email);
    });
    
    writeJSON('contacts.json', cleanedContacts);
    
    return { success: true, synced: users.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Synchronise un utilisateur spécifique vers les contacts de tous les autres utilisateurs
 * Appelé lors de la création d'un nouvel utilisateur
 */
export const syncNewUserToContacts = (newUser) => {
  try {
    const users = readJSON('users.json') || [];
    const contacts = readJSON('contacts.json') || [];
    
    // Pour chaque utilisateur existant (sauf le nouveau), ajouter le nouveau comme contact
    users.forEach(user => {
      if (user.id === newUser.id) {
        return; // Ne pas créer de contact pour soi-même
      }
      
      // Vérifier si le contact existe déjà
      const existingContact = contacts.find(
        c => c.userId === user.id && c.email === newUser.email
      );
      
      if (!existingContact) {
        const newContact = {
          id: uuidv4(),
          userId: user.id,
          nom: newUser.nom,
          prenom: newUser.prenom,
          email: newUser.email,
          telephone: '',
          entreprise: '',
          notes: '',
          dateCreation: new Date().toISOString(),
          dateModification: new Date().toISOString(),
          syncedFromUser: true,
        };
        
        contacts.push(newContact);
      }
    });
    
    // Pour le nouvel utilisateur, ajouter tous les autres utilisateurs comme contacts
    users.forEach(otherUser => {
      if (otherUser.id === newUser.id) {
        return; // Ne pas créer de contact pour soi-même
      }
      
      const existingContact = contacts.find(
        c => c.userId === newUser.id && c.email === otherUser.email
      );
      
      if (!existingContact) {
        const newContact = {
          id: uuidv4(),
          userId: newUser.id,
          nom: otherUser.nom,
          prenom: otherUser.prenom,
          email: otherUser.email,
          telephone: '',
          entreprise: '',
          notes: '',
          dateCreation: new Date().toISOString(),
          dateModification: new Date().toISOString(),
          syncedFromUser: true,
        };
        
        contacts.push(newContact);
      }
    });
    
    writeJSON('contacts.json', contacts);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour les contacts correspondant à un utilisateur modifié
 * Appelé lors de la mise à jour d'un utilisateur
 * Préserve les modifications manuelles (téléphone, entreprise, notes)
 */
export const updateUserInContacts = (updatedUser) => {
  try {
    const contacts = readJSON('contacts.json') || [];
    
    // Mettre à jour tous les contacts qui correspondent à cet utilisateur (par email)
    const updatedContacts = contacts.map(contact => {
      if (contact.email === updatedUser.email && contact.syncedFromUser) {
        return {
          ...contact,
          nom: updatedUser.nom,
          prenom: updatedUser.prenom,
          email: updatedUser.email,
          // Préserver les champs modifiés manuellement (téléphone, entreprise, notes)
          // Ils ne sont pas écrasés par la synchronisation
          dateModification: new Date().toISOString(),
        };
      }
      return contact;
    });
    
    writeJSON('contacts.json', updatedContacts);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Supprime les contacts correspondant à un utilisateur supprimé
 * Appelé lors de la suppression d'un utilisateur
 */
export const removeUserFromContacts = (deletedUserEmail, deletedUserId) => {
  try {
    const contacts = readJSON('contacts.json') || [];
    
    // Supprimer tous les contacts qui correspondent à cet utilisateur :
    // 1. Les contacts synchronisés automatiquement (par email)
    // 2. Les contacts créés manuellement par cet utilisateur (par userId)
    const remainingContacts = contacts.filter(contact => {
      // Supprimer les contacts synchronisés automatiquement qui correspondent à l'email
      if (contact.syncedFromUser && contact.email === deletedUserEmail) {
        return false;
      }
      
      // Supprimer les contacts créés manuellement par cet utilisateur
      if (contact.userId === deletedUserId) {
        return false;
      }
      
      return true;
    });
    
    writeJSON('contacts.json', remainingContacts);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

