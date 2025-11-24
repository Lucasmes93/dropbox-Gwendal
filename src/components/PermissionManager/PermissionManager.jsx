import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notifications';
import './PermissionManager.scss';

export const PermissionManager = ({ file, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [shareWithCompany, setShareWithCompany] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    loadPermissions();
  }, [file]);

  const loadUsers = async () => {
    try {
      const allUsers = await api.getUsers();
      setUsers(allUsers.filter(u => u.id !== user?.id)); // Exclure l'utilisateur actuel
    } catch (error) {
    }
  };

  const loadPermissions = () => {
    if (!file) return;
    
    const currentPermissions = file.permissions || {};
    setPermissions(currentPermissions);
    
    // Vérifier si partagé avec toute la boîte
    setShareWithCompany(!!currentPermissions.public && currentPermissions.public.length > 0);
    setLoading(false);
  };

  const handlePermissionChange = (userId, permissionType, checked) => {
    const newPermissions = { ...permissions };
    
    if (!newPermissions[userId]) {
      newPermissions[userId] = [];
    }
    
    if (checked) {
      if (!newPermissions[userId].includes(permissionType)) {
        newPermissions[userId].push(permissionType);
      }
    } else {
      newPermissions[userId] = newPermissions[userId].filter(p => p !== permissionType);
      if (newPermissions[userId].length === 0) {
        delete newPermissions[userId];
      }
    }
    
    setPermissions(newPermissions);
  };

  const handleCompanyShareChange = (checked) => {
    setShareWithCompany(checked);
    const newPermissions = { ...permissions };
    
    if (checked) {
      // Partager avec toute la boîte : read, write, delete par défaut
      newPermissions.public = ['read', 'write', 'delete'];
    } else {
      delete newPermissions.public;
    }
    
    setPermissions(newPermissions);
  };

  const handleInheritPermissions = async () => {
    if (!file.parentId) {
      notifyError('Erreur', 'Ce dossier n\'a pas de parent', 'Aucun dossier parent');
      return;
    }

    try {
      // Récupérer le dossier parent
      const parentFile = await api.getFile(file.parentId);
      if (parentFile && parentFile.permissions) {
        setPermissions({ ...parentFile.permissions });
        setShareWithCompany(!!parentFile.permissions.public && parentFile.permissions.public.length > 0);
        notifySuccess('Permissions héritées', 'Les permissions du dossier parent ont été appliquées');
      }
    } catch (error) {
      notifyError('Erreur', 'Impossible d\'hériter des permissions', error?.message);
    }
  };

  const handleApplyToChildren = async () => {
    if (!confirm('Voulez-vous appliquer ces permissions à tous les sous-dossiers et fichiers ?')) {
      return;
    }

    try {
      await api.applyPermissionsToChildren(file.id, permissions);
      notifySuccess('Permissions appliquées', 'Les permissions ont été appliquées à tous les enfants');
      if (onUpdate) onUpdate();
    } catch (error) {
      notifyError('Erreur', 'Impossible d\'appliquer les permissions', error?.message);
    }
  };

  const handleSave = async () => {
    try {
      await api.updateFileMetadata(file.id, { permissions });
      
      // Créer un log d'activité
      try {
        await api.createActivityLog({
          type: 'permission_changed',
          description: `a modifié les permissions de "${file.nom}"`,
          details: { fileId: file.id, fileName: file.nom },
        });
      } catch (logError) {
      }

      notifySuccess('Permissions mises à jour', 'Les permissions ont été mises à jour avec succès');
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      notifyError('Erreur', 'Impossible de sauvegarder les permissions', error?.message);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content permission-manager" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content permission-manager" onClick={(e) => e.stopPropagation()}>
        <div className="permission-header">
          <h2>Gérer les permissions - {file?.nom}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="permission-actions">
          {file?.parentId && (
            <button className="btn-secondary" onClick={handleInheritPermissions}>
              Hériter des permissions du parent
            </button>
          )}
          {file?.type === 'dossier' && (
            <button className="btn-secondary" onClick={handleApplyToChildren}>
              Appliquer aux sous-dossiers et fichiers
            </button>
          )}
        </div>

        <div className="permission-section">
          <h3>Partage avec toute la boîte</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={shareWithCompany}
              onChange={(e) => handleCompanyShareChange(e.target.checked)}
            />
            <span>Partager avec tous les utilisateurs (lecture, écriture, modification)</span>
          </label>
        </div>

        <div className="permission-section">
          <h3>Permissions par utilisateur</h3>
          <div className="permission-table">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Lecture</th>
                  <th>Écriture</th>
                  <th>Suppression</th>
                  <th>Partage</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const userPermissions = permissions[u.id] || [];
                  return (
                    <tr key={u.id}>
                      <td>{u.prenom} {u.nom}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={userPermissions.includes('read')}
                          onChange={(e) => handlePermissionChange(u.id, 'read', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={userPermissions.includes('write')}
                          onChange={(e) => handlePermissionChange(u.id, 'write', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={userPermissions.includes('delete')}
                          onChange={(e) => handlePermissionChange(u.id, 'delete', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={userPermissions.includes('share')}
                          onChange={(e) => handlePermissionChange(u.id, 'share', e.target.checked)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="permission-footer">
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};



