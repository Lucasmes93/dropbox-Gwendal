import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import './Favorites.scss';

export const Favorites = () => {
  const [favoriteFiles, setFavoriteFiles] = useState([]);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const saved = localStorage.getItem('monDrive_files');
        if (saved) {
          const allFiles = JSON.parse(saved);
          const favorites = allFiles.filter(f => f.estFavori && !f.estSupprime);
          setFavoriteFiles(favorites);
        } else {
          setFavoriteFiles([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
        setFavoriteFiles([]);
      }
    };

    // Charger immédiatement
    loadFavorites();
    
    // Écouter les mises à jour
    const handleUpdate = () => {
      loadFavorites();
    };
    window.addEventListener('filesUpdated', handleUpdate);
    
    // Écouter les événements de synchronisation
    const handleDataSynced = (e) => {
      const customEvent = e;
      if (customEvent.detail?.key === 'monDrive_files') {
        loadFavorites();
      }
    };
    window.addEventListener('dataSynced', handleDataSynced);
    
    return () => {
      window.removeEventListener('filesUpdated', handleUpdate);
      window.removeEventListener('dataSynced', handleDataSynced);
    };
  }, []); // Charger une seule fois au montage

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  return (
    <Layout>
      <div className="files-page">
        <h1>Favoris</h1>
        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Taille</th>
                <th>Date de modification</th>
              </tr>
            </thead>
            <tbody>
              {favoriteFiles.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="file-icon">⭐</span>
                    {file.nom}
                  </td>
                  <td>{file.type === 'dossier' ? 'Dossier' : file.extension?.toUpperCase()}</td>
                  <td>{formatSize(file.taille)}</td>
                  <td>{new Date(file.dateModification).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {favoriteFiles.length === 0 && (
            <div className="empty-state">Aucun fichier favori</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

