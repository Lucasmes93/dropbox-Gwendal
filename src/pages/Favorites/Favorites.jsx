import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import './Favorites.scss';

export const Favorites = () => {
  const [favoriteFiles, setFavoriteFiles] = useState([]);

  useEffect(() => {
    let isUpdating = false; // Éviter les mises à jour simultanées

    const loadFavorites = () => {
      if (isUpdating) return;
      try {
        const saved = localStorage.getItem('monDrive_files');
        if (saved) {
          const allFiles = JSON.parse(saved);
          const favorites = allFiles.filter(f => f.estFavori && !f.estSupprime);
          // Comparer avec l'état actuel pour éviter les re-renders inutiles
          const currentSerialized = JSON.stringify(favoriteFiles);
          const newSerialized = JSON.stringify(favorites);
          if (newSerialized !== currentSerialized) {
            isUpdating = true;
            setFavoriteFiles(favorites);
            setTimeout(() => { isUpdating = false; }, 100);
          }
        } else {
          if (favoriteFiles.length > 0) {
            setFavoriteFiles([]);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
        if (favoriteFiles.length > 0) {
          setFavoriteFiles([]);
        }
      }
    };

    // Charger immédiatement
    loadFavorites();
    
    // Écouter les mises à jour avec debounce
    let timeoutId;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(loadFavorites, 200); // Debounce de 200ms
    };
    window.addEventListener('filesUpdated', handleUpdate);
    
    // Écouter les événements de synchronisation avec debounce
    const handleDataSynced = (e) => {
      const customEvent = e;
      if (customEvent.detail?.key === 'monDrive_files') {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(loadFavorites, 200); // Debounce de 200ms
      }
    };
    window.addEventListener('dataSynced', handleDataSynced);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('filesUpdated', handleUpdate);
      window.removeEventListener('dataSynced', handleDataSynced);
    };
  }, [favoriteFiles]); // Dépendance nécessaire pour la comparaison

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

