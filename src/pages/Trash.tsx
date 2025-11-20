import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import type { FileItem } from '../types';
import '../styles/Files.css';

export const Trash = () => {
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [showConfirm, setShowConfirm] = useState<{
    type: 'single' | 'all';
    item?: FileItem;
  } | null>(null);

  // Charger les fichiers supprimés depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles: FileItem[] = JSON.parse(saved);
        const deleted = allFiles.filter(f => f.estSupprime === true);
        setTrashedFiles(deleted);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la corbeille:', error);
    }
  }, []);

  // Mettre à jour quand localStorage change (écouter les changements)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('monDrive_files');
        if (saved) {
          const allFiles: FileItem[] = JSON.parse(saved);
          const deleted = allFiles.filter(f => f.estSupprime === true);
          setTrashedFiles(deleted);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la corbeille:', error);
      }
    };

    // Écouter les changements de localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Vérifier périodiquement (pour les changements dans le même onglet)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  const updateAllFiles = (updater: (files: FileItem[]) => FileItem[]) => {
    try {
      const saved = localStorage.getItem('monDrive_files');
      if (saved) {
        const allFiles: FileItem[] = JSON.parse(saved);
        const updated = updater(allFiles);
        localStorage.setItem('monDrive_files', JSON.stringify(updated));
        // Déclencher un événement pour notifier les autres composants
        window.dispatchEvent(new Event('filesUpdated'));
        // Mettre à jour l'affichage
        const deleted = updated.filter(f => f.estSupprime === true);
        setTrashedFiles(deleted);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleRestore = (item: FileItem) => {
    updateAllFiles(files => files.map(f =>
      f.id === item.id ? { ...f, estSupprime: false } : f
    ));
  };

  const handleDeletePermanently = (item: FileItem) => {
    updateAllFiles(files => files.filter(f => f.id !== item.id));
    setShowConfirm(null);
  };

  const handleEmptyTrash = () => {
    updateAllFiles(files => files.filter(f => !f.estSupprime));
    setShowConfirm(null);
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

          {trashedFiles.length === 0 && (
            <div className="empty-state">La corbeille est vide</div>
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

