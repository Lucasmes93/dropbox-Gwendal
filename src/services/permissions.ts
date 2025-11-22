// Service de gestion des permissions sur les fichiers/dossiers
// Conforme au cahier des charges : "Gérer l'arborescence des dossiers et des droits d'accès à ceux-ci"

import type { FileItem, PermissionType, User } from '../types';

// Vérifier si un utilisateur a une permission sur un fichier/dossier
export const hasPermission = (
  file: FileItem,
  userId: string,
  permission: PermissionType,
  user?: User
): boolean => {
  // Si l'utilisateur est admin, il a tous les droits
  if (user?.role === 'admin') {
    return true;
  }

  // Si l'utilisateur est le propriétaire, il a tous les droits
  if (file.proprietaireId === userId) {
    return true;
  }

  // Vérifier les permissions spécifiques
  if (file.permissions) {
    // Permissions publiques
    if (file.permissions.public?.includes(permission)) {
      return true;
    }

    // Permissions par utilisateur
    if (file.permissions[userId]?.includes(permission)) {
      return true;
    }
  }

  return false;
};

// Vérifier si un utilisateur peut lire un fichier/dossier
export const canRead = (file: FileItem, userId: string, user?: User): boolean => {
  return hasPermission(file, userId, 'read', user);
};

// Vérifier si un utilisateur peut écrire/modifier un fichier/dossier
export const canWrite = (file: FileItem, userId: string, user?: User): boolean => {
  return hasPermission(file, userId, 'write', user);
};

// Vérifier si un utilisateur peut supprimer un fichier/dossier
export const canDelete = (file: FileItem, userId: string, user?: User): boolean => {
  return hasPermission(file, userId, 'delete', user);
};

// Vérifier si un utilisateur peut partager un fichier/dossier
export const canShare = (file: FileItem, userId: string, user?: User): boolean => {
  return hasPermission(file, userId, 'share', user);
};

// Définir les permissions pour un utilisateur sur un fichier/dossier
export const setPermission = (
  file: FileItem,
  userId: string,
  permissions: PermissionType[]
): FileItem => {
  if (!file.permissions) {
    file.permissions = {};
  }

  file.permissions[userId] = permissions;
  return file;
};

// Définir les permissions publiques
export const setPublicPermissions = (
  file: FileItem,
  permissions: PermissionType[]
): FileItem => {
  if (!file.permissions) {
    file.permissions = {};
  }

  file.permissions.public = permissions;
  return file;
};

// Retirer les permissions d'un utilisateur
export const removePermission = (file: FileItem, userId: string): FileItem => {
  if (file.permissions && file.permissions[userId]) {
    delete file.permissions[userId];
  }
  return file;
};

// Obtenir toutes les permissions d'un fichier/dossier
export const getPermissions = (file: FileItem) => {
  return file.permissions || {};
};

// Exemples d'utilisation :
// if (canRead(file, user.id, user)) { /* afficher le fichier */ }
// if (canWrite(file, user.id, user)) { /* permettre l'édition */ }
// const updatedFile = setPermission(file, targetUserId, ['read', 'write']);

