import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { notifySuccess, notifyError } from '../../services/notifications';
import { PermissionManager } from '../../components/PermissionManager/PermissionManager';
import api from '../../services/api';
import './Admin.scss';

export const Admin = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      return; // Ne pas charger si pas admin
    }
    loadUsers();
    loadFiles();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const loadedUsers = await api.getUsers();
      setUsers(loadedUsers);
    } catch (error) {
      notifyError(
        'Erreur de chargement',
        'Impossible de charger les utilisateurs',
        error?.message || 'Erreur serveur',
        'load_users'
      );
    }
  };

  const loadFiles = async () => {
    try {
      const allFiles = await api.getFiles();
      setFiles(allFiles);
    } catch (error) {
    }
  };

  const handleManagePermissions = (file) => {
    setSelectedFile(file);
    setShowPermissionManager(true);
  };

  const handleCreateUser = async () => {
    if (!newUser.nom || !newUser.prenom || !newUser.email || !newUser.password) {
      notifyError(
        'Erreur de création',
        'Veuillez remplir tous les champs',
        'Champs manquants',
        'user_creation'
      );
      return;
    }

    try {
      // Créer l'utilisateur via l'API
      const userToCreate = await api.createUser({
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });

      // Recharger la liste
      await loadUsers();

      // Journaliser l'action
      try {
        await api.createActivityLog({
          type: 'user_created',
          description: `a créé l'utilisateur ${newUser.prenom} ${newUser.nom} (${newUser.email})`,
          details: { targetUserId: userToCreate.id },
          accessibleBy: ['admin'],
        });
      } catch (logError) {
      }

      notifySuccess(
        'Utilisateur créé',
        `L'utilisateur ${newUser.prenom} ${newUser.nom} a été créé avec succès`,
        'user_creation'
      );

      setNewUser({ nom: '', prenom: '', email: '', password: '', role: 'user' });
      setShowCreateModal(false);
    } catch (error) {
      notifyError(
        'Erreur de création',
        `Impossible de créer l'utilisateur`,
        error?.message || 'Erreur serveur',
        'user_creation'
      );
    }
  };

  const handleBlockUser = async (userId) => {
    const userToBlock = users.find(u => u.id === userId);
    if (!userToBlock) return;

    try {
      // Bloquer via l'API
      await api.toggleBlockUser(userId);

      // Recharger la liste
      await loadUsers();

      // Journaliser l'action
      try {
        await api.createActivityLog({
          type: 'user_blocked',
          description: `a bloqué l'utilisateur ${userToBlock.prenom} ${userToBlock.nom}`,
          details: { targetUserId: userId },
          accessibleBy: ['admin'],
        });
      } catch (logError) {
      }

      notifySuccess(
        'Utilisateur bloqué',
        `L'utilisateur ${userToBlock.prenom} ${userToBlock.nom} a été bloqué`,
        'user_block'
      );
    } catch (error) {
      notifyError(
        'Erreur',
        `Impossible de bloquer l'utilisateur`,
        error?.message || 'Erreur serveur',
        'user_block'
      );
    }
  };

  const handleUnblockUser = async (userId) => {
    const userToUnblock = users.find(u => u.id === userId);
    if (!userToUnblock) return;

    try {
      // Débloquer via l'API
      await api.toggleBlockUser(userId);

      // Recharger la liste
      await loadUsers();

      // Journaliser l'action
      try {
        await api.createActivityLog({
          type: 'user_unblocked',
          description: `a débloqué l'utilisateur ${userToUnblock.prenom} ${userToUnblock.nom}`,
          details: { targetUserId: userId },
          accessibleBy: ['admin'],
        });
      } catch (logError) {
      }

      notifySuccess(
        'Utilisateur débloqué',
        `L'utilisateur ${userToUnblock.prenom} ${userToUnblock.nom} a été débloqué`,
        'user_unblock'
      );
    } catch (error) {
      notifyError(
        'Erreur',
        `Impossible de débloquer l'utilisateur`,
        error?.message || 'Erreur serveur',
        'user_unblock'
      );
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) {
      notifyError(
        'Erreur',
        'Aucun utilisateur sélectionné',
        'Veuillez sélectionner un utilisateur',
        'password_reset'
      );
      return;
    }

    if (isResettingPassword) {
      return; // Éviter les doubles clics
    }

    setIsResettingPassword(true);

    try {
      // Réinitialiser via l'API
      const response = await api.resetPassword(selectedUser.id);

      // Vérifier que la réponse contient le mot de passe temporaire
      if (!response || !response.tempPassword) {
        throw new Error('La réponse du serveur ne contient pas le mot de passe temporaire');
      }

      // Le log d'activité est créé automatiquement par le backend

      // Afficher le mot de passe dans une alerte pour qu'il soit bien visible
      alert(
        `✅ Mot de passe réinitialisé avec succès !\n\n` +
        `Utilisateur : ${selectedUser.prenom} ${selectedUser.nom}\n` +
        `Nouveau mot de passe temporaire : ${response.tempPassword}\n\n` +
        `⚠️ IMPORTANT : Notez ce mot de passe, il ne sera plus affiché !`
      );

      notifySuccess(
        'Mot de passe réinitialisé',
        `Le mot de passe temporaire a été généré pour ${selectedUser.prenom} ${selectedUser.nom}`,
        'password_reset'
      );

      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } catch (error) {
      notifyError(
        'Erreur',
        `Impossible de réinitialiser le mot de passe`,
        error?.message || 'Erreur serveur',
        'password_reset'
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    // Empêcher de changer son propre rôle
    if (userId === user?.id) {
      notifyError(
        'Erreur',
        'Vous ne pouvez pas modifier votre propre rôle',
        'Action non autorisée',
        'role_change'
      );
      // Recharger pour annuler le changement dans l'UI
      await loadUsers();
      return;
    }

    // Confirmation si on retire le rôle admin
    if (userToUpdate.role === 'admin' && newRole === 'user') {
      const confirmMessage = `Êtes-vous sûr de vouloir retirer le rôle administrateur à ${userToUpdate.prenom} ${userToUpdate.nom} ?\n\nIl doit rester au moins un administrateur dans le système.`;
      if (!confirm(confirmMessage)) {
        // Recharger pour annuler le changement dans l'UI
        await loadUsers();
        return;
      }
    }

    try {
      // Mettre à jour le rôle via l'API
      await api.updateUser(userId, { role: newRole });

      // Recharger la liste
      await loadUsers();

      // Le log d'activité est créé automatiquement par le backend

      const roleLabel = newRole === 'admin' ? 'administrateur' : 'utilisateur';
      notifySuccess(
        'Rôle modifié',
        `${userToUpdate.prenom} ${userToUpdate.nom} est maintenant ${roleLabel}`,
        'role_change'
      );
    } catch (error) {
      // Recharger pour annuler le changement dans l'UI
      await loadUsers();
      notifyError(
        'Erreur',
        `Impossible de modifier le rôle`,
        error?.message || 'Erreur serveur',
        'role_change'
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    const confirmMessage = `⚠️ ATTENTION : Cette action est irréversible !\n\n` +
      `Vous êtes sur le point de supprimer définitivement l'utilisateur :\n` +
      `- ${userToDelete.prenom} ${userToDelete.nom}\n` +
      `- ${userToDelete.email}\n\n` +
      `Cela supprimera TOUTES ses données :\n` +
      `• Tous ses fichiers et dossiers\n` +
      `• Tous ses logs d'activité\n` +
      `• Toutes ses notifications\n` +
      `• Tous ses événements du calendrier\n` +
      `• Toutes ses notes\n` +
      `• Toutes ses tâches\n` +
      `• Tous ses tableaux\n` +
      `• Tous ses contacts\n\n` +
      `Êtes-vous absolument sûr de vouloir continuer ?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Supprimer via l'API
      await api.deleteUser(userId);

      // Recharger la liste
      await loadUsers();

      // Le log d'activité est créé automatiquement par le backend

      notifySuccess(
        'Utilisateur supprimé',
        `L'utilisateur ${userToDelete.prenom} ${userToDelete.nom} et toutes ses données ont été supprimés définitivement`,
        'user_delete'
      );
    } catch (error) {
      notifyError(
        'Erreur',
        `Impossible de supprimer l'utilisateur`,
        error?.message || 'Erreur serveur',
        'user_delete'
      );
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <Layout>
        <div className="admin-page">
          <div className="admin-error">
            <h2>Accès refusé</h2>
            <p>Vous devez être administrateur pour accéder à cette page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-page">
        <div className="admin-header">
          <h1>Administration</h1>
          <div className="admin-header-actions">
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              + Créer un utilisateur
            </button>
          </div>
        </div>

        <div className="admin-section">
          <h2>Gestion des permissions des dossiers</h2>
          <div className="files-list">
            {files.filter(f => f.type === 'dossier' && !f.estSupprime).map(folder => (
              <div key={folder.id} className="file-item">
                <span className="file-icon">📁</span>
                <span className="file-name">{folder.nom}</span>
                <button 
                  className="btn-secondary btn-small"
                  onClick={() => handleManagePermissions(folder)}
                >
                  Gérer les permissions
                </button>
              </div>
            ))}
            {files.filter(f => f.type === 'dossier' && !f.estSupprime).length === 0 && (
              <p className="empty-message">Aucun dossier disponible</p>
            )}
          </div>
        </div>

        <div className="admin-section">
          <h2>Gestion des utilisateurs</h2>
        </div>

        <div className="admin-search">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Date de création</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.nom}</td>
                  <td>{u.prenom}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className={`role-select ${u.role}`}
                      disabled={u.id === user?.id} // Ne pas permettre de changer son propre rôle
                    >
                      <option value="user">Utilisateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </td>
                  <td>
                    {u.bloque ? (
                      <span className="status-badge blocked">Bloqué</span>
                    ) : (
                      <span className="status-badge active">Actif</span>
                    )}
                  </td>
                  <td>
                    {u.dateCreation
                      ? new Date(u.dateCreation).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="btn-secondary btn-small"
                        onClick={() => {
                          setSelectedUser(u);
                          setShowResetPasswordModal(true);
                        }}
                      >
                        Réinitialiser MDP
                      </button>
                      {u.bloque ? (
                        <button
                          className="btn-success btn-small"
                          onClick={() => handleUnblockUser(u.id)}
                        >
                          Débloquer
                        </button>
                      ) : (
                        <button
                          className="btn-warning btn-small"
                          onClick={() => handleBlockUser(u.id)}
                        >
                          Bloquer
                        </button>
                      )}
                      <button
                        className="btn-danger btn-small"
                        onClick={() => handleDeleteUser(u.id)}
                        title="Supprimer définitivement l'utilisateur et toutes ses données"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Créer un utilisateur</h2>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={newUser.nom}
                  onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  value={newUser.prenom}
                  onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rôle</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </button>
                <button className="btn-primary" onClick={handleCreateUser}>
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {showResetPasswordModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowResetPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Réinitialiser le mot de passe</h2>
              <p>
                Êtes-vous sûr de vouloir réinitialiser le mot de passe de{' '}
                <strong>{selectedUser.prenom} {selectedUser.nom}</strong> ?
              </p>
              <p className="modal-warning">
                Un nouveau mot de passe temporaire sera généré et affiché.
              </p>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowResetPasswordModal(false)}
                >
                  Annuler
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? 'Réinitialisation...' : 'Réinitialiser'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPermissionManager && selectedFile && (
          <PermissionManager
            file={selectedFile}
            onClose={() => {
              setShowPermissionManager(false);
              setSelectedFile(null);
            }}
            onUpdate={() => {
              loadFiles();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

