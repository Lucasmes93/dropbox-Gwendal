import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import api from '../../services/api';
import './Trash.scss';

export const Trash = () => {
  const { user } = useAuth();
  const [trashedFiles, setTrashedFiles] = useState([]);
  const [showConfirm, setShowConfirm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrashedFiles();
    
    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket
    const unsubscribeFileDeleted = onWebSocketEvent('file_deleted', () => {
      loadTrashedFiles();
    });
    const unsubscribeFileRestored = onWebSocketEvent('file_restored', () => {
      loadTrashedFiles();
    });

    // Recharger toutes les 10 secondes en fallback
    const interval = setInterval(loadTrashedFiles, 10000);
    
    return () => {
      clearInterval(interval);
      unsubscribeFileDeleted();
      unsubscribeFileRestored();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadTrashedFiles = async () => {
    try {
      setLoading(true);
      const allFiles = await api.getFiles();
      const deleted = allFiles.filter(f => f.estSupprime === true);
      setTrashedFiles(deleted);
    } catch (error) {
      setTrashedFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  const handleRestore = async (item) => {
    try {
      await api.restoreFile(item.id);
      await loadTrashedFiles();
      alert('Fichier restauré avec succès');
    } catch (error) {
      alert('Erreur lors de la restauration: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleDeletePermanently = async (item) => {
    try {
      await api.deleteFile(item.id);
      await loadTrashedFiles();
      setShowConfirm(null);
      alert('Fichier supprimé définitivement');
    } catch (error) {
      alert('Erreur lors de la suppression définitive: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleEmptyTrash = async () => {
    try {
      // Supprimer tous les fichiers de la corbeille
      for (const item of trashedFiles) {
        await api.deleteFile(item.id);
      }
      await loadTrashedFiles();
      setShowConfirm(null);
      alert('Corbeille vidée avec succès');
    } catch (error) {
      alert('Erreur lors du vidage de la corbeille: ' + (error?.message || 'Erreur serveur'));
    }
  };

  return (
    <Layout>
      <div className="files-page">
        <div className="toolbar">
          <h1>Corbeille</h1>
          <button
            className="btn-danger"
            onClick={() => setShowConfirm({ type: 'all' })}
            disabled={trashedFiles.length === 0}
          >
            Vider la corbeille
          </button>
        </div>

        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Date de suppression</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trashedFiles.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="file-icon">{file.type === 'dossier' ? '📁' : '📄'}</span>
                    {file.nom}
                  </td>
                  <td>{file.type === 'dossier' ? 'Dossier' : file.extension?.toUpperCase()}</td>
                  <td>{formatSize(file.taille)}</td>
                  <td>{new Date(file.dateModification).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="actions-inline">
                      <button
                        className="btn-secondary btn-small"
                        onClick={() => handleRestore(file)}
                      >
                        Restaurer
                      </button>
                      <button
                        className="btn-danger btn-small"
                        onClick={() => setShowConfirm({ type: 'single', item: file })}
                      >
                        Supprimer définitivement
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && trashedFiles.length === 0 && (
            <div className="empty-state">La corbeille est vide</div>
          )}
          {loading && (
            <div className="empty-state">Chargement...</div>
          )}
        </div>

        {showConfirm && (
          <div className="modal-overlay" onClick={() => setShowConfirm(null)}>
            <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
              <h2>Confirmation</h2>
              <p>
                {showConfirm.type === 'all'
                  ? 'Êtes-vous sûr de vouloir vider la corbeille ? Cette action est irréversible.'
                  : `Êtes-vous sûr de vouloir supprimer définitivement "${showConfirm.item?.nom}" ? Cette action est irréversible.`}
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowConfirm(null)}>
                  Annuler
                </button>
                <button
                  className="btn-danger"
                  onClick={() =>
                    showConfirm.type === 'all'
                      ? handleEmptyTrash()
                      : showConfirm.item && handleDeletePermanently(showConfirm.item)
                  }
                >
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

