import express from 'express';
import multer from 'multer';
import { readJSON, writeJSON, DATA_DIR } from '../utils/storage.js';
import { authenticate } from '../utils/auth.js';
import { enrichUser } from '../utils/enrichUser.js';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { broadcast } from '../utils/broadcast.js';
import { createActivityLog } from '../utils/activityLogger.js';

const router = express.Router();
router.use(authenticate);
router.use(enrichUser);

// Configuration Multer pour les uploads
const uploadsDir = join(DATA_DIR, 'uploads');
// S'assurer que le dossier uploads existe
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

// Récupérer tous les fichiers de l'utilisateur
router.get('/', (req, res) => {
  try {
    const files = readJSON('files.json') || [];
    const userId = req.user.id;
    
    // Fonction pour vérifier si un fichier est accessible
    const isFileAccessible = (file) => {
      // Propriétaire
      if (file.proprietaireId === userId) return true;
      
      // Admin voit tout
      if (req.user.role === 'admin') return true;
      
      // Permissions spécifiques
      if (file.permissions && file.permissions[userId]) {
        // L'utilisateur a des permissions spécifiques
        return file.permissions[userId].includes('read');
      }
      
      // Permissions publiques (partagé avec toute la boîte)
      if (file.permissions && file.permissions.public) {
        return file.permissions.public.includes('read');
      }
      
      // Vérifier si un ancêtre a des permissions qui permettent l'accès direct
      // (cas où l'utilisateur a accès à un sous-dossier mais pas au parent)
      if (file.parentId) {
        const checkAncestorAccess = (parentId) => {
          if (!parentId) return false;
          const parent = files.find(f => f.id === parentId);
          if (!parent) return false;
          
          // Si le parent a des permissions pour cet utilisateur, on peut accéder aux enfants
          if (parent.permissions && parent.permissions[userId]) {
            return parent.permissions[userId].includes('read');
          }
          
          // Vérifier récursivement les ancêtres
          if (parent.parentId) {
            return checkAncestorAccess(parent.parentId);
          }
          
          return false;
        };
        
        // Si l'utilisateur a accès direct à ce fichier via un ancêtre, l'autoriser
        return checkAncestorAccess(file.parentId);
      }
      
      return false;
    };
    
    // Filtrer les fichiers accessibles par l'utilisateur
    const userFiles = files.filter(file => {
      if (file.estSupprime) return false; // Ne pas inclure les fichiers supprimés
      return isFileAccessible(file);
    });

    res.json(userFiles);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Téléverser un fichier
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const files = readJSON('files.json') || [];
    
    // Hériter des permissions du dossier parent si présent
    let inheritedPermissions = null;
    if (req.body.parentId) {
      const parentFolder = files.find(f => f.id === req.body.parentId && f.type === 'dossier');
      if (parentFolder && parentFolder.permissions) {
        inheritedPermissions = { ...parentFolder.permissions };
      }
    }
    
    // Si pas de parent ou pas de permissions héritées, permissions par défaut : partagé avec toute la boîte
    if (!inheritedPermissions) {
      inheritedPermissions = {
        public: ['read', 'write', 'delete'],
      };
    }
    
    const newFile = {
      id: uuidv4(),
      nom: req.file.originalname,
      type: 'fichier',
      taille: req.file.size,
      dateModification: new Date().toISOString(),
      extension: req.file.originalname.split('.').pop() || '',
      parentId: req.body.parentId || null,
      mimeType: req.file.mimetype,
      proprietaireId: req.user.id,
      filePath: req.file.filename,
      estSupprime: false,
      permissions: inheritedPermissions,
    };

    files.push(newFile);
    const writeSuccess = writeJSON('files.json', files);
    
    if (!writeSuccess) {
      return res.status(500).json({ error: 'Erreur lors de l\'écriture des données' });
    }

    // Créer un log d'activité
    const isCreation = req.body.isCreation === 'true' || req.body.isCreation === true;
    const actionDescription = isCreation 
      ? `a créé le fichier "${newFile.nom}"`
      : `a téléversé le fichier "${newFile.nom}"`;
    
    createActivityLog(req, 'file_created', actionDescription, {
      fileId: newFile.id,
      fileName: newFile.nom,
      fileSize: newFile.taille,
      fileType: newFile.type,
      isCreation,
    });

    // Diffuser l'événement à tous les clients connectés
    try {
      broadcast({
        type: 'file_created',
        file: newFile,
        userId: req.user.id,
      });
    } catch (broadcastError) {
      // Ne pas bloquer la réponse si la diffusion échoue
    }

    res.status(201).json(newFile);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Créer un dossier
router.post('/folder', (req, res) => {
  try {
    const { nom, parentId } = req.body;

    if (!nom) {
      return res.status(400).json({ error: 'Le nom du dossier est requis' });
    }

    const files = readJSON('files.json') || [];

    const newFolder = {
      id: uuidv4(),
      nom,
      type: 'dossier',
      dateModification: new Date().toISOString(),
      parentId: parentId || null,
      proprietaireId: req.user.id,
      estSupprime: false,
      // Permissions par défaut : partagé avec toute la boîte (read, write, delete)
      permissions: {
        public: ['read', 'write', 'delete'],
      },
    };

    files.push(newFolder);
    writeJSON('files.json', files);

    // Créer un log d'activité
    createActivityLog(req, 'folder_created', `a créé le dossier "${newFolder.nom}"`, {
      folderId: newFolder.id,
      folderName: newFolder.nom,
    });

    // Diffuser l'événement à tous les clients connectés
    broadcast({
      type: 'folder_created',
      folder: newFolder,
      userId: req.user.id,
    });

    res.status(201).json(newFolder);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un fichier/dossier (corbeille)
router.delete('/:id', (req, res) => {
  try {
    const files = readJSON('files.json') || [];
    const fileIndex = files.findIndex(f => f.id === req.params.id);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const file = files[fileIndex];

    // Vérifier les permissions
    if (file.proprietaireId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Si le fichier est déjà dans la corbeille, supprimer définitivement
    if (file.estSupprime) {
      // Supprimer le fichier physique s'il existe
      if (file.type === 'fichier' && file.filePath) {
        try {
          const filePath = join(DATA_DIR, 'uploads', file.filePath);
          if (existsSync(filePath)) {
            unlinkSync(filePath);
          }
        } catch (unlinkError) {
          // Continuer même si la suppression physique échoue
        }
      }

      // Supprimer de la liste
      files.splice(fileIndex, 1);
      writeJSON('files.json', files);

      // Créer un log d'activité
      createActivityLog(req, 'file_permanently_deleted', `a supprimé définitivement "${file.nom}"`, {
        fileId: file.id,
        fileName: file.nom,
        fileType: file.type,
      });

      // Diffuser l'événement
      broadcast({
        type: 'file_permanently_deleted',
        fileId: req.params.id,
        userId: req.user.id,
      });

      return res.json({ message: 'Fichier supprimé définitivement' });
    }

    // Sinon, marquer comme supprimé (corbeille)
    files[fileIndex].estSupprime = true;
    files[fileIndex].dateSuppression = new Date().toISOString();
    writeJSON('files.json', files);

    // Créer un log d'activité
    createActivityLog(req, 'file_deleted', `a supprimé "${file.nom}"`, {
      fileId: file.id,
      fileName: file.nom,
      fileType: file.type,
    });

    // Diffuser l'événement
    broadcast({
      type: 'file_deleted',
      fileId: req.params.id,
      userId: req.user.id,
    });

    res.json({ message: 'Fichier supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Télécharger un fichier
router.get('/:id/download', (req, res) => {
  try {
    const files = readJSON('files.json') || [];
    const file = files.find(f => f.id === req.params.id);

    if (!file || file.type !== 'fichier') {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Vérifier les permissions
    if (file.proprietaireId !== req.user.id && req.user.role !== 'admin') {
      if (!file.permissions || !file.permissions[req.user.id]?.includes('read')) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    const filePath = join(DATA_DIR, 'uploads', file.filePath);
    
    // Créer un log d'activité
    createActivityLog(req, 'file_downloaded', `a téléchargé "${file.nom}"`, {
      fileId: file.id,
      fileName: file.nom,
      fileSize: file.taille,
    });
    
    res.download(filePath, file.nom);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Renommer un fichier/dossier
router.patch('/:id/rename', (req, res) => {
  try {
    const { nom } = req.body;
    
    if (!nom || !nom.trim()) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    const files = readJSON('files.json') || [];
    const fileIndex = files.findIndex(f => f.id === req.params.id);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const file = files[fileIndex];

    // Vérifier les permissions
    if (file.proprietaireId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Mettre à jour le nom
    files[fileIndex].nom = nom.trim();
    files[fileIndex].dateModification = new Date().toISOString();
    
    // Si c'est un fichier, mettre à jour l'extension
    if (file.type === 'fichier' && nom.includes('.')) {
      files[fileIndex].extension = nom.split('.').pop();
    }

    writeJSON('files.json', files);

    // Créer un log d'activité
    createActivityLog(req, 'file_renamed', `a renommé "${file.nom}" en "${files[fileIndex].nom}"`, {
      fileId: files[fileIndex].id,
      oldName: file.nom,
      newName: files[fileIndex].nom,
    });

    // Diffuser l'événement
    broadcast({
      type: 'file_renamed',
      file: files[fileIndex],
      userId: req.user.id,
    });

    res.json(files[fileIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Déplacer un fichier/dossier
router.patch('/:id/move', (req, res) => {
  try {
    const { parentId } = req.body;

    const files = readJSON('files.json') || [];
    const fileIndex = files.findIndex(f => f.id === req.params.id);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const file = files[fileIndex];

    // Vérifier les permissions
    if (file.proprietaireId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier que le parent existe (si fourni)
    if (parentId) {
      const parent = files.find(f => f.id === parentId && f.type === 'dossier');
      if (!parent) {
        return res.status(400).json({ error: 'Dossier parent invalide' });
      }
    }

    // Mettre à jour le parent
    files[fileIndex].parentId = parentId || null;
    files[fileIndex].dateModification = new Date().toISOString();

    writeJSON('files.json', files);

    // Créer un log d'activité
    const parentName = parentId ? files.find(f => f.id === parentId)?.nom || 'dossier parent' : 'racine';
    createActivityLog(req, 'file_moved', `a déplacé "${file.nom}" vers "${parentName}"`, {
      fileId: file.id,
      fileName: file.nom,
      oldParentId: file.parentId,
      newParentId: parentId,
    });

    // Diffuser l'événement
    broadcast({
      type: 'file_moved',
      file: files[fileIndex],
      userId: req.user.id,
    });

    res.json(files[fileIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Restaurer un fichier/dossier depuis la corbeille
router.patch('/:id/restore', (req, res) => {
  try {
    const files = readJSON('files.json') || [];
    const fileIndex = files.findIndex(f => f.id === req.params.id);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const file = files[fileIndex];

    // Vérifier les permissions
    if (file.proprietaireId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Restaurer
    files[fileIndex].estSupprime = false;
    files[fileIndex].dateModification = new Date().toISOString();
    delete files[fileIndex].dateSuppression;

    writeJSON('files.json', files);

    // Créer un log d'activité
    createActivityLog(req, 'file_restored', `a restauré "${file.nom}" depuis la corbeille`, {
      fileId: file.id,
      fileName: file.nom,
      fileType: file.type,
    });

    // Diffuser l'événement
    broadcast({
      type: 'file_restored',
      file: files[fileIndex],
      userId: req.user.id,
    });

    res.json(files[fileIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le contenu d'un fichier
router.put('/:id/content', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const files = readJSON('files.json') || [];
    const fileIndex = files.findIndex(f => f.id === req.params.id);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const file = files[fileIndex];

    // Vérifier les permissions
    if (file.proprietaireId !== req.user.id && req.user.role !== 'admin') {
      if (!file.permissions || !file.permissions[req.user.id]?.includes('write')) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    // Supprimer l'ancien fichier physique
    if (file.filePath) {
      const oldFilePath = join(DATA_DIR, 'uploads', file.filePath);
      if (existsSync(oldFilePath)) {
        unlinkSync(oldFilePath);
      }
    }

    // Mettre à jour le fichier
    files[fileIndex].filePath = req.file.filename;
    files[fileIndex].taille = req.file.size;
    files[fileIndex].dateModification = new Date().toISOString();
    files[fileIndex].mimeType = req.file.mimetype;

    writeJSON('files.json', files);

    // Créer un log d'activité
    createActivityLog(req, 'file_updated', `a modifié le contenu de "${file.nom}"`, {
      fileId: file.id,
      fileName: file.nom,
      fileSize: req.file.size,
    });

    // Diffuser l'événement
    broadcast({
      type: 'file_updated',
      file: files[fileIndex],
      userId: req.user.id,
    });

    res.json(files[fileIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Verrouiller un fichier pour l'édition
router.post('/:id/lock', (req, res) => {
  try {
    const files = readJSON('files.json') || [];
    const file = files.find(f => f.id === req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Vérifier si le fichier est déjà verrouillé
    if (file.lockedBy && file.lockedBy !== req.user.id) {
      const users = readJSON('users.json') || [];
      const locker = users.find(u => u.id === file.lockedBy);
      const lockerName = locker ? `${locker.prenom} ${locker.nom}` : 'Un utilisateur';
      return res.status(409).json({ 
        error: 'Fichier verrouillé',
        lockedBy: file.lockedBy,
        lockedByName: lockerName,
      });
    }

    // Verrouiller le fichier
    file.lockedBy = req.user.id;
    file.lockedAt = new Date().toISOString();
    writeJSON('files.json', files);

    res.json({ locked: true, fileId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Déverrouiller un fichier
router.post('/:id/unlock', (req, res) => {
  try {
    const files = readJSON('files.json') || [];
    const fileIndex = files.findIndex(f => f.id === req.params.id);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const file = files[fileIndex];

    // Vérifier que l'utilisateur peut déverrouiller (propriétaire ou admin)
    if (file.lockedBy && file.lockedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Déverrouiller
    files[fileIndex].lockedBy = null;
    files[fileIndex].lockedAt = null;
    writeJSON('files.json', files);

    res.json({ locked: false, fileId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un fichier par ID
router.get('/:id', (req, res) => {
  try {
    const files = readJSON('files.json') || [];
    const file = files.find(f => f.id === req.params.id);

    if (!file) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Vérifier les permissions
    if (file.proprietaireId !== req.user.id && req.user.role !== 'admin') {
      if (!file.permissions || !file.permissions[req.user.id]?.includes('read')) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour les métadonnées (tags, favoris, permissions, localPath, lastLocalSync)
router.patch('/:id', (req, res) => {
  try {
    const { tags, estFavori, permissions, localPath, lastLocalSync } = req.body;

    const files = readJSON('files.json') || [];
    const fileIndex = files.findIndex(f => f.id === req.params.id);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const file = files[fileIndex];

    // Vérifier les permissions
    if (file.proprietaireId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Mettre à jour les métadonnées
    if (tags !== undefined) files[fileIndex].tags = tags;
    if (estFavori !== undefined) files[fileIndex].estFavori = estFavori;
    if (permissions !== undefined) files[fileIndex].permissions = permissions;
    if (localPath !== undefined) files[fileIndex].localPath = localPath;
    if (lastLocalSync !== undefined) files[fileIndex].lastLocalSync = lastLocalSync;
    
    files[fileIndex].dateModification = new Date().toISOString();

    writeJSON('files.json', files);

    // Créer un log d'activité selon le type de modification
    let activityType = 'file_updated';
    let activityDescription = `a modifié "${file.nom}"`;
    
    if (tags !== undefined) {
      activityDescription = `a modifié les étiquettes de "${file.nom}"`;
      activityType = 'file_tagged';
    } else if (estFavori !== undefined) {
      activityDescription = estFavori 
        ? `a ajouté "${file.nom}" aux favoris`
        : `a retiré "${file.nom}" des favoris`;
      activityType = 'file_favorited';
    } else if (permissions !== undefined) {
      activityDescription = `a modifié les permissions de "${file.nom}"`;
      activityType = 'file_permissions_updated';
    }

    createActivityLog(req, activityType, activityDescription, {
      fileId: file.id,
      fileName: file.nom,
      tags: tags !== undefined ? tags : file.tags,
      estFavori: estFavori !== undefined ? estFavori : file.estFavori,
    });

    // Diffuser l'événement
    broadcast({
      type: 'file_updated',
      file: files[fileIndex],
      userId: req.user.id,
    });

    res.json(files[fileIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Appliquer les permissions à tous les enfants d'un dossier
router.post('/:id/apply-permissions', (req, res) => {
  try {
    const { permissions } = req.body;
    const files = readJSON('files.json') || [];
    const folder = files.find(f => f.id === req.params.id);

    if (!folder || folder.type !== 'dossier') {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    // Vérifier les permissions (admin ou propriétaire)
    if (folder.proprietaireId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Fonction récursive pour appliquer les permissions à tous les enfants
    const applyToChildren = (parentId) => {
      const children = files.filter(f => f.parentId === parentId && !f.estSupprime);
      children.forEach(child => {
        const childIndex = files.findIndex(f => f.id === child.id);
        if (childIndex !== -1) {
          // Appliquer les permissions (sauf si l'enfant a déjà des permissions spécifiques)
          files[childIndex].permissions = { ...permissions };
          files[childIndex].dateModification = new Date().toISOString();
          
          // Si c'est un dossier, appliquer récursivement
          if (child.type === 'dossier') {
            applyToChildren(child.id);
          }
        }
      });
    };

    applyToChildren(req.params.id);
    writeJSON('files.json', files);

    // Créer un log d'activité
    createActivityLog(req, 'permission_changed', `a appliqué les permissions de "${folder.nom}" à tous ses enfants`, {
      folderId: folder.id,
      folderName: folder.nom,
    });

    res.json({ message: 'Permissions appliquées avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

